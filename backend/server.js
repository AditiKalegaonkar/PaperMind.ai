import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose"; // Ensure mongoose is available for ObjectId
import session from "express-session";
import MongoStore from "connect-mongo";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import bcrypt from "bcryptjs";
import passport from "./passport.js";

import passport from "./passport.js";

import User from "./User.js";
import Chat from "./Chat.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.MONGO_URI || !process.env.SESSION_SECRET || !process.env.PORT || !process.env.FRONTEND_URL) {
    console.error("FATAL ERROR: Missing required environment variables.");
    process.exit(1);
}

app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

// --- MongoDB connection (for user data) ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// --- In-memory session (for production use connect-mongo or Redis) ---
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// --- Google Auth ---
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Ensure callback works whether GOOGLE_CALLBACK is full URL or just path
let callbackPath = process.env.GOOGLE_CALLBACK;
try {
  callbackPath = new URL(process.env.GOOGLE_CALLBACK).pathname;
} catch {
  // if it's already just a path, keep it
}

app.get(
    process.env.GOOGLE_CALLBACK_URL,
    passport.authenticate("google", { failureRedirect: `${process.env.FRONTEND_URL}/login` }),
    (req, res) => {
        res.redirect(`${process.env.FRONTEND_URL}/userDashboard`);
    }
);

// --- Registration & Login ---
app.post("/auth/register", async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;
  if (!firstName || !lastName || !email || !password || !phone)
    return res.status(400).json({ error: "Missing fields" });

  if (await User.findOne({ email: email.toLowerCase() }))
    return res.status(400).json({ error: "Email exists" });

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

app.get("/chat/:sessionId", isAuthenticated, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;
        const chat = await Chat.findOne({ userId, "sessions.sessionId": sessionId }, { "sessions.$": 1 });
        if (!chat || !chat.sessions || chat.sessions.length === 0) {
            return res.status(404).json({ error: "Chat session not found" });
        }
        res.json({ session: chat.sessions[0] });
    } catch (err) {
        console.error("Fetch chat error:", err);
        res.status(500).json({ error: "Failed to fetch chat" });
    }
});

app.get("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect(process.env.FRONTEND_URL);
  });
});

// --- Auth middleware ---
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated() || req.session.user) return next();
  res.status(401).json({ error: "User not authenticated" });
};

// --- Multer config for file uploads ---
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Invalid file type. Only PDF, DOC, DOCX, and TXT allowed."));
  },
});

// --- Analyze route (calls Python) ---
app.post("/analyze", isAuthenticated, upload.single("document"), (req, res) => {
  const { query } = req.body;
  const file = req.file;
  const userId = req.session.user?.id || req.user?._id;

  if (!file) return res.status(400).send("No document uploaded");
  if (!query) {
    fs.unlinkSync(file.path);
    return res.status(400).send("Query is required");
  }

  const pythonScript = path.resolve(__dirname, "..", "python-backend", "agent.py");
  if (!fs.existsSync(pythonScript)) return res.status(500).send("Python script not found");

  const pythonProcess = spawn("python", [pythonScript], {
    stdio: ["pipe", "pipe", "pipe"],
    cwd: path.dirname(pythonScript),
  });

  pythonProcess.stdin.write(
    JSON.stringify({
      userId: userId?.toString(),
      query: query.trim(),
      path: path.resolve(file.path),
    })
  );
  pythonProcess.stdin.end();

  let output = "";
  pythonProcess.stdout.on("data", (data) => (output += data.toString()));
  pythonProcess.stderr.on("data", (data) => console.error(data.toString()));

  pythonProcess.on("close", () => {
    fs.unlink(file.path, (err) => {
      if (err) console.error(`Failed to delete temp file: ${err}`);
    });
    res.send(output);
  });
});

// --- Health check ---
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", uptime: process.uptime() });
});

// --- Serve frontend ---
const frontendBuild = path.join(__dirname, "../frontend/build");
if (fs.existsSync(frontendBuild)) {
  app.use(express.static(frontendBuild));
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendBuild, "index.html"));
  });
} else {
  app.get("/", (req, res) =>
    res.json({ message: "Backend running, frontend not found." })
  );
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));