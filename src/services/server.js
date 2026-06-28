import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

import express from "express";
import mongoose from "mongoose";
import passport from "./passport.js";
import session from "express-session";
import MongoStore from "connect-mongo";
import cors from "cors";
import bcrypt from "bcryptjs";
import axios from "axios";
import multer from "multer";
import fs from "fs";
import FormData from "form-data";
import rateLimit from "express-rate-limit";

import User from "./Database/User.js";

const app = express();
app.set('trust proxy', true);

const FASTAPI_URL = process.env.FASTAPI_URL;

// ───────────────── Upload directory ─────────────────
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ───────────────── Middleware ─────────────────
app.use(express.json());

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["X-Session-Id", "X-Adk-Session-Id"],
  })
);

const sessionStore = MongoStore.create({
  mongoUrl: process.env.MONGO_URI,
  collectionName: "sessions",
  // touchAfter: only re-save the session if it hasn't been written in this
  // many seconds, since per-request writes are unnecessary overhead. Default
  // omitted on purpose for now while debugging — add back to 24*3600 once
  // confirmed working, to reduce write load.
});

sessionStore.on("error", (err) => {
  console.error("Session store error:", err);
});

sessionStore.on("create", (sessionId) => {
  console.log("Session created in store:", sessionId);
});

app.use(
  session({
    name: "__Host-connect.sid",
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    proxy: true,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ── TEMPORARY DEBUG MIDDLEWARE ──────────────────────────────────────────────
// Logs, for every request: the raw cookie header, the session ID Express
// resolved it to, and whether req.session.user exists at that point. This
// runs AFTER the session middleware has had a chance to load the session
// from the store, so it tells us definitively whether the deserialized
// session actually contains user data on this specific request.
// Remove this block once the auth issue is confirmed fixed.
app.use((req, res, next) => {
  console.log(
    "[DEBUG]", req.method, req.path,
    "| cookie header present:", !!req.headers.cookie,
    "| session.id:", req.sessionID,
    "| session.user:", req.session ? JSON.stringify(req.session.user) : "(no req.session)",
    "| req.user (passport):", JSON.stringify(req.user),
  );
  next();
});

// Google OAuth
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: `${FRONTEND_URL}/login` }),
  (req, res) => {
    console.log("Google user:", req.user);
    res.redirect(`${FRONTEND_URL}/userDashboard`);
  }
);

// ───────────────── Rate limiters ─────────────────
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
});

// ───────────────── Auth guard ─────────────────
const requireAuth = (req, res, next) => {
  const user = req.user || req.session.user;
  if (!user?.email) return res.status(401).json({ error: "Not authenticated" });
  req.currentUser = user;
  next();
};

// ───────────────── MongoDB ─────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then((c) => console.log("MongoDB connected:", c.connection.name))
  .catch((err) => console.error("MongoDB error:", err.message));

// ───────────────── Auth routes ─────────────────
app.post("/auth/register", authLimiter, async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, countryCode } = req.body;

    if (!firstName || !email || !password)
      return res.status(400).json({ error: "Missing fields" });

    if (await User.findOne({ email }))
      return res.status(400).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);

    await new User({
      firstName,
      lastName,
      email,
      password: hashed,
      phone,
      countryCode,
    }).save();

    res.status(201).json({ message: "Account created" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/auth/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ error: "Session creation failed" });
      }

      req.session.user = {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
      };

      req.session.save((err) => {
        if (err) {
          return res.status(500).json({ error: "Login failed" });
        }

        res.json({
          message: "Logged in",
          user: req.session.user,
        });
      });
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/auth/user", (req, res) => {
  console.log(
    "[DEBUG] /auth/user | session.id:", req.sessionID,
    "| req.session.user:", JSON.stringify(req.session.user),
    "| req.user:", JSON.stringify(req.user),
  );
  res.json({ user: req.user || req.session.user || null });
});

app.get("/auth/logout", (req, res) => {
  req.session.destroy(() => res.redirect(FRONTEND_URL));
});

// ───────────────── File cleanup helper ─────────────────
const cleanFiles = (files) => {
  if (!files) return;
  files.forEach((f) => {
    try {
      if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
    } catch {}
  });
};

// ───────────────── CHAT ROUTE ─────────────────
app.post(
  "/api/chat",
  requireAuth,
  chatLimiter,
  upload.array("files", 5),
  (req, res) => {
    const { agent, question, sessionId, stream } = req.body;

    if (!agent || !question) {
      cleanFiles(req.files);
      return res.status(400).json({ error: "agent and question required" });
    }

    const form = new FormData();

    form.append("agent", agent);
    form.append("username", req.currentUser.email);
    form.append("question", question);
    if (typeof sessionId === "string" && sessionId.trim().length > 0) {
      form.append("sessionId", sessionId.trim());
    }

    if (stream) form.append("stream", stream);

    (req.files || []).forEach((f) => {
      form.append("files", fs.createReadStream(f.path), {
        filename: f.originalname,
        contentType: f.mimetype,
      });
    });

    const fastapiUrl = new URL(`${FASTAPI_URL}/chat`);

    const options = {
      hostname: fastapiUrl.hostname,
      port: fastapiUrl.port || 8000,
      path: fastapiUrl.pathname,
      method: "POST",
      headers: form.getHeaders(),
      timeout: 120000,
    };

    const proxyReq = http.request(options, (proxyRes) => {
      const blocked = new Set(["connection", "transfer-encoding", "keep-alive"]);

      for (const [key, value] of Object.entries(proxyRes.headers)) {
        if (!blocked.has(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      }

      const sessionIdHeader = proxyRes.headers["x-session-id"];
      const adkHeader = proxyRes.headers["x-adk-session-id"];
      if (sessionIdHeader) res.setHeader("X-Session-Id", sessionIdHeader);
      if (adkHeader) res.setHeader("X-Adk-Session-Id", adkHeader);

      res.statusCode = proxyRes.statusCode;
      res.flushHeaders();

      proxyRes.on("end", () => cleanFiles(req.files));

      proxyRes.pipe(res);
    });

    proxyReq.on("error", (err) => {
      cleanFiles(req.files);
      console.error("Chat proxy error:", err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: "Chat service failed" });
      }
    });

    proxyReq.on("timeout", () => {
      proxyReq.destroy();
      cleanFiles(req.files);
      if (!res.headersSent) {
        res.status(504).json({ error: "FastAPI timeout" });
      }
    });

    form.pipe(proxyReq);
  }
);

// ───────────────── Sessions ─────────────────
app.get("/api/sessions", requireAuth, async (req, res) => {
  try {
    const r = await axios.get(
      `${FASTAPI_URL}/sessions/${encodeURIComponent(req.currentUser.email)}`
    );
    res.json(r.data);
  } catch {
    res.json({ sessions: [] });
  }
});

// ───────────────── Chat history ─────────────────
app.get("/api/chat/:sessionId", requireAuth, async (req, res) => {
  try {
    const r = await axios.get(
      `${FASTAPI_URL}/chat/${encodeURIComponent(
        req.currentUser.email
      )}/${encodeURIComponent(req.params.sessionId)}`
    );
    res.json(r.data);
  } catch {
    res.json({ messages: [] });
  }
});

// ───────────────── Update session metadata ─────────────────
app.patch("/api/chat/:sessionId/metadata", requireAuth, async (req, res) => {
  const { documents } = req.body;
  try {
    const r = await axios.patch(
      `${FASTAPI_URL}/chat/${encodeURIComponent(
        req.currentUser.email
      )}/${encodeURIComponent(req.params.sessionId)}/metadata`,
      { documents }
    );
    res.json(r.data);
  } catch {
    res.json({ success: false });
  }
});

// ───────────────── Rename session ─────────────────
app.patch("/api/chat/:sessionId/rename", requireAuth, async (req, res) => {
  const { title } = req.body;
  try {
    const form = new URLSearchParams();
    form.append("title", title);
    const r = await axios.patch(
      `${FASTAPI_URL}/chat/${encodeURIComponent(
        req.currentUser.email
      )}/${encodeURIComponent(req.params.sessionId)}/rename`,
      form.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    res.json(r.data);
  } catch {
    res.json({ success: false });
  }
});

// ───────────────── Delete session ─────────────────
app.delete("/api/chat/:sessionId", requireAuth, async (req, res) => {
  try {
    const r = await axios.delete(
      `${FASTAPI_URL}/chat/${encodeURIComponent(
        req.currentUser.email
      )}/${encodeURIComponent(req.params.sessionId)}`
    );
    res.json(r.data);
  } catch {
    res.status(500).json({ error: "Delete failed" });
  }
});

// ───────────────── Static frontend ─────────────────
const frontendBuild = path.join(__dirname, "..", "dist");

app.use(express.static(frontendBuild));

app.get("/", (_, res) =>
  res.sendFile(path.join(frontendBuild, "index.html"))
);

// ───────────────── Error middleware ─────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// ───────────────── Start server ─────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});