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
import User from "./User.js";
import multer from "multer";
import { spawn } from "child_process";
import fs from "fs";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    cookie: { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 },
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  process.env.GOOGLE_CALLBACK,
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}/userDashboard`);
  }
);

app.post("/auth/register", async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;

  if (!firstName || !lastName || !email || !password || !phone) {
    return res.status(400).json({ error: "Missing fields" });
  }

  if (await User.findOne({ email: email.toLowerCase() })) {
    return res.status(400).json({ error: "Email exists" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const newUser = new User({
    firstName,
    lastName,
    email: email.toLowerCase(),
    password: hashed,
    phone,
  });
  await newUser.save();

  res.status(201).json({ message: "User created" });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  req.session.user = { id: user._id, firstName: user.firstName, email: user.email };
  res.json({ message: "Logged in", user: req.session.user });
});

app.get("/auth/user", (req, res) => {
  res.json({ user: req.user || req.session.user || null });
});

app.get("/auth/logout", (req, res, next) => {
  if (req.logout) {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy();
      res.clearCookie('connect.sid');
      res.redirect(process.env.FRONTEND_URL);
    });
  } else {
    req.session.destroy();
    res.clearCookie('connect.sid');
    res.redirect(process.env.FRONTEND_URL);
  }
});

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated() || req.session.user) {
    return next();
  }
  res.status(401).json({ error: "User not authenticated" });
};

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage: storage });

app.post("/analyze", isAuthenticated, upload.single("document"), (req, res) => {
  let tempFilePath = '';
  try {
    const { query } = req.body;
    const file = req.file;
    const userId = req.session.user?.id || req.user?.id;

    if (!file) {
      return res.status(400).json({ details: "No document file was uploaded." });
    }
    if (!userId) {
      return res.status(401).json({ details: "Could not identify user from session." });
    }
    tempFilePath = file.path;

    const pythonScriptPath = path.join(__dirname, "..", "python-backend", "agent.py");
    
    const pythonProcess = spawn("python", [pythonScriptPath]);
    
    const dataForPython = {
        userId: userId,
        query: query,
        path: tempFilePath
    };

    pythonProcess.stdin.write(JSON.stringify(dataForPython));
    pythonProcess.stdin.end();

    let pythonOutput = "";
    let pythonError = "";

    pythonProcess.stdout.on("data", (data) => (pythonOutput += data.toString()));
    pythonProcess.stderr.on("data", (data) => (pythonError += data.toString()));

    pythonProcess.on("close", (code) => {
      console.log(`Python process exited with code ${code}`);
      if (code === 0) {
        res.status(200).json({ response: pythonOutput });
      } else {
        res.status(500).json({ details: `Python script error: ${pythonError}` });
      }
      fs.unlink(tempFilePath, (err) => {
        if (err) console.error(`Failed to delete temp file: ${err}`);
      });
    });
  } catch (error) {
    console.error("Server error in /analyze:", error);
    res.status(500).json({ details: "An unexpected server error occurred." });
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlink(tempFilePath, (err) => {
        if (err) console.error(`Failed to delete temp file on error: ${err}`);
      });
    }
  }
});

const frontendBuildPath = path.join(__dirname, "../frontend/build");
app.use(express.static(frontendBuildPath));
app.get("/", (_, res) => {
  res.sendFile(path.join(frontendBuildPath, "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));