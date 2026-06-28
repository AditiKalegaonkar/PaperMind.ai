import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

import express from "express";
import mongoose from "mongoose";
import passport from "./passport.js";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";
import multer from "multer";
import fs from "fs";
import FormData from "form-data";
import rateLimit from "express-rate-limit";

import User from "./Database/User.js";

const app = express();
app.set("trust proxy", 1);

const FASTAPI_URL = process.env.FASTAPI_URL;
const FRONTEND_URL = process.env.FRONTEND_URL;
const JWT_SECRET = process.env.JWT_SECRET;

console.log("FRONTEND_URL:", FRONTEND_URL);
console.log("FASTAPI_URL:", FASTAPI_URL);

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

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["X-Session-Id", "X-Adk-Session-Id"],
  })
);

// ───────────────── JWT Auth guard ─────────────────
const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  try {
    const decoded = jwt.verify(header.split(" ")[1], JWT_SECRET);
    req.currentUser = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// ───────────────── Rate limiters ─────────────────
const chatLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

// ───────────────── MongoDB ─────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then((c) => console.log("MongoDB connected:", c.connection.name))
  .catch((err) => console.error("MongoDB error:", err.message));

// ───────────────── Google OAuth ─────────────────
app.use(passport.initialize());

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: `${FRONTEND_URL}/login`, session: false }),
  (req, res) => {
    const user = req.user;
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, firstName: user.firstName },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

// ───────────────── Auth routes ─────────────────
app.post("/auth/register", authLimiter, async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, countryCode } = req.body;

    if (!firstName || !email || !password)
      return res.status(400).json({ error: "Missing fields" });

    if (await User.findOne({ email }))
      return res.status(400).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    await new User({ firstName, lastName, email, password: hashed, phone, countryCode }).save();

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

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, firstName: user.firstName },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Logged in",
      token,
      user: { id: user._id.toString(), email: user.email, firstName: user.firstName },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/auth/user", requireAuth, (req, res) => {
  res.json({ user: req.currentUser });
});

app.get("/auth/logout", (req, res) => {
  res.json({ success: true });
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
  async (req, res) => {
    const { agent, question, sessionId, stream } = req.body;

    console.log("CHAT HIT — user:", req.currentUser?.email);
    console.log("FASTAPI_URL:", FASTAPI_URL);
    console.log("agent:", agent, "| question:", question?.slice(0, 60));

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

    try {
      console.log("Proxying to:", `${FASTAPI_URL}/chat`);

      const fastapiRes = await axios.post(`${FASTAPI_URL}/chat`, form, {
        headers: form.getHeaders(),
        responseType: "stream",
        timeout: 120000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      // Forward session headers to frontend
      const sessionIdHeader = fastapiRes.headers["x-session-id"];
      const adkHeader       = fastapiRes.headers["x-adk-session-id"];
      if (sessionIdHeader) res.setHeader("X-Session-Id", sessionIdHeader);
      if (adkHeader)       res.setHeader("X-Adk-Session-Id", adkHeader);

      // Forward content-type so SSE streams correctly
      if (fastapiRes.headers["content-type"]) {
        res.setHeader("Content-Type", fastapiRes.headers["content-type"]);
      }

      res.statusCode = fastapiRes.status;
      fastapiRes.data.pipe(res);
      fastapiRes.data.on("end", () => cleanFiles(req.files));
      fastapiRes.data.on("error", (err) => {
        console.error("FastAPI stream error:", err.message);
        cleanFiles(req.files);
      });

    } catch (err) {
      cleanFiles(req.files);
      console.error("Chat proxy error:", err.message);
      if (err.response) {
        console.error("FastAPI status:", err.response.status);
        // Drain error stream for logging
        let errBody = "";
        err.response.data.on("data", (chunk) => { errBody += chunk; });
        err.response.data.on("end", () => console.error("FastAPI error body:", errBody));
      }
      if (!res.headersSent) {
        res.status(502).json({ error: "Chat service error", detail: err.message });
      }
    }
  }
);

// ───────────────── Sessions ─────────────────
app.get("/api/sessions", requireAuth, async (req, res) => {
  try {
    const r = await axios.get(
      `${FASTAPI_URL}/sessions/${encodeURIComponent(req.currentUser.email)}`
    );
    res.json(r.data);
  } catch (err) {
    console.error("Sessions error:", err.message);
    res.json({ sessions: [] });
  }
});

// ───────────────── Chat history ─────────────────
app.get("/api/chat/:sessionId", requireAuth, async (req, res) => {
  try {
    const r = await axios.get(
      `${FASTAPI_URL}/chat/${encodeURIComponent(req.currentUser.email)}/${encodeURIComponent(req.params.sessionId)}`
    );
    res.json(r.data);
  } catch (err) {
    console.error("Chat history error:", err.message);
    res.json({ messages: [] });
  }
});

// ───────────────── Update session metadata ─────────────────
app.patch("/api/chat/:sessionId/metadata", requireAuth, async (req, res) => {
  const { documents } = req.body;
  try {
    const r = await axios.patch(
      `${FASTAPI_URL}/chat/${encodeURIComponent(req.currentUser.email)}/${encodeURIComponent(req.params.sessionId)}/metadata`,
      { documents }
    );
    res.json(r.data);
  } catch (err) {
    console.error("Metadata error:", err.message);
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
      `${FASTAPI_URL}/chat/${encodeURIComponent(req.currentUser.email)}/${encodeURIComponent(req.params.sessionId)}/rename`,
      form.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    res.json(r.data);
  } catch (err) {
    console.error("Rename error:", err.message);
    res.json({ success: false });
  }
});

// ───────────────── Delete session ─────────────────
app.delete("/api/chat/:sessionId", requireAuth, async (req, res) => {
  try {
    const r = await axios.delete(
      `${FASTAPI_URL}/chat/${encodeURIComponent(req.currentUser.email)}/${encodeURIComponent(req.params.sessionId)}`
    );
    res.json(r.data);
  } catch (err) {
    console.error("Delete error:", err.message);
    res.status(500).json({ error: "Delete failed" });
  }
});

// ───────────────── Static frontend ─────────────────
const frontendBuild = path.join(__dirname, "..", "dist");
app.use(express.static(frontendBuild));
app.get("/", (_, res) => res.sendFile(path.join(frontendBuild, "index.html")));

// ───────────────── Error middleware ─────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// ───────────────── Start server ─────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));