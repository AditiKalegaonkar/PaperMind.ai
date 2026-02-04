import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import passport from "./passport.js";
import session from "express-session";
import cors from "cors";
import bcrypt from "bcryptjs";
import axios from "axios";
import multer from "multer";
import fs from "fs";
import FormData from "form-data";

import User from "./Database/User.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ---------------- MULTER CONFIGURATION ---------------- */

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "image/png",
    "image/jpeg",
    "image/jpg",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type."), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

/* ---------------- MIDDLEWARE ---------------- */

app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

/* ---------------- DATABASE ---------------- */

mongoose
  .connect(process.env.MONGO_URI)
  .then((conn) => {
    console.log("MongoDB connected");
    console.log("DB:", conn.connection.name);
  })
  .catch((err) => {
    console.error("MongoDB error:", err.message);
  });

/* ---------------- AUTH ---------------- */

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}/userDashboard`);
  }
);

app.post("/auth/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, countryCode } = req.body;
    if (!firstName || !email || !password) return res.status(400).json({ error: "Missing fields" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      firstName, lastName, email, password: hashed,
      phone: { countryCode: countryCode || null, number: phone || null },
    });
    await user.save();
    res.status(201).json({ message: "User created" });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.password) return res.status(400).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    req.session.user = { id: user._id, email: user.email, firstName: user.firstName };
    res.json({ message: "Logged in", user: req.session.user });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/auth/user", (req, res) => {
  const user = req.user || req.session.user || null;
  res.json({ user });
});

app.get("/auth/logout", (req, res) => {
  const logoutFunc = (cb) => req.session.destroy(cb);
  if (req.logout) req.logout(() => logoutFunc(() => res.redirect(process.env.FRONTEND_URL)));
  else logoutFunc(() => res.redirect(process.env.FRONTEND_URL));
});

/* ---------------- FASTAPI PROXY (PaperMind) ---------------- */

const FASTAPI_URL = process.env.FLASK_API_URL;

app.post("/api/chat", upload.array("files", 5), async (req, res) => {
  try {
    const user = req.user || req.session.user;
    if (!user || !user.email) {
      if (req.files) req.files.forEach((f) => fs.unlinkSync(f.path));
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { agent, question, sessionId } = req.body;
    if (!agent || !question) {
      if (req.files) req.files.forEach((f) => fs.unlinkSync(f.path));
      return res.status(400).json({ error: "Missing fields" });
    }

    const formData = new FormData();
    formData.append("agent", agent);
    formData.append("username", user.email);
    formData.append("question", question);
    if (sessionId) formData.append("sessionId", sessionId);

    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        formData.append("files", fs.createReadStream(file.path), {
          filename: file.originalname,
          contentType: file.mimetype,
        });
      });
    }

    const r = await axios.post(`${FASTAPI_URL}/chat`, formData, {
      headers: { ...formData.getHeaders() },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    if (req.files) req.files.forEach((f) => fs.unlinkSync(f.path));
    res.json(r.data);
  } catch (err) {
    if (req.files) req.files.forEach((f) => { if(fs.existsSync(f.path)) fs.unlinkSync(f.path) });
    console.error("Chat error:", err.response?.data || err.message);
    res.status(500).json({ error: "Chat service failed", details: err.response?.data || err.message });
  }
});

// NEW ROUTE: Get Latest Session (Proxies to FastAPI)
app.get("/api/chat/latest", async (req, res) => {
  try {
    const user = req.user || req.session.user;
    if (!user || !user.email) return res.status(401).json({ error: "Not authenticated" });

    const r = await axios.get(`${FASTAPI_URL}/chat/latest/${encodeURIComponent(user.email)}`);
    res.json(r.data);
  } catch (err) {
    console.error("Latest chat error:", err.response?.data || err.message);
    res.json({ sessionId: null, messages: [] }); // Safe fallback
  }
});

app.get("/api/sessions", async (req, res) => {
  try {
    const user = req.user || req.session.user;
    if (!user || !user.email) return res.status(401).json({ error: "Not authenticated" });

    const r = await axios.get(`${FASTAPI_URL}/sessions/${encodeURIComponent(user.email)}`);
    res.json(r.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to load sessions" });
  }
});

app.get("/api/chat/:sessionId", async (req, res) => {
  try {
    const user = req.user || req.session.user;
    if (!user || !user.email) return res.status(401).json({ error: "Not authenticated" });

    const { sessionId } = req.params;
    const r = await axios.get(`${FASTAPI_URL}/chat/${encodeURIComponent(user.email)}/${encodeURIComponent(sessionId)}`);
    res.json(r.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to load chat" });
  }
});

/* ---------------- FILE CLEANUP & SERVER ---------------- */

const cleanupOldFiles = () => {
  const maxAge = 24 * 60 * 60 * 1000;
  fs.readdir(uploadsDir, (err, files) => {
    if (err) return;
    files.forEach((file) => {
      const filePath = path.join(uploadsDir, file);
      fs.stat(filePath, (err, stats) => {
        if (!err && (Date.now() - stats.mtimeMs > maxAge)) fs.unlink(filePath, () => {});
      });
    });
  });
};
setInterval(cleanupOldFiles, 24 * 60 * 60 * 1000);

const frontendBuildPath = path.join(__dirname, "../frontend/build");
app.use(express.static(frontendBuildPath));
app.get("/", (_, res) => res.sendFile(path.join(frontendBuildPath, "index.html")));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});