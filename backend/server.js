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

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
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

// MongoDB connection
console.log("MONGO_URI =", process.env.MONGO_URI);

mongoose
  .connect(process.env.MONGO_URI)
  .then((conn) => {
    console.log("MongoDB connected");
    console.log("DB Name:", conn.connection.name);
    console.log("Host:", conn.connection.host);
  })
  .catch((err) => {
    console.error("MongoDB error:", err.message);
  });

/* -------- AUTH ROUTES -------- */

// Google OAuth
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

// Register
app.post("/auth/register", async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;

  if (!firstName || !lastName || !email || !password || !phone) {
    return res.status(400).json({ error: "Missing fields" });
  }

  if (await User.findOne({ email })) {
    return res.status(400).json({ error: "Email exists" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const newUser = new User({ firstName, lastName, email, password: hashed, phone });
  await newUser.save();

  res.status(201).json({ message: "User created" });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  // 1. Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  // 2. Check if password field exists (extra safety)
  if (!user.password) {
    return res.status(500).json({ error: "User has no password stored" });
  }

  // 3. Compare password safely
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  // 4. Success
  req.session.user = {
    id: user._id,
    firstName: user.firstName,
    email: user.email,
  };

  res.json({ message: "Logged in", user: req.session.user });
});


// Get logged-in user
app.get("/auth/user", (req, res) => {
  res.json({ user: req.user || req.session.user || null });
});

// Logout
app.get("/auth/logout", (req, res) => {
  if (req.logout) {
    req.logout(() => {
      req.session = null;
      res.redirect(process.env.FRONTEND_URL);
    });
  } else {
    req.session = null;
    res.redirect(process.env.FRONTEND_URL);
  }
});

const frontendBuildPath = path.join(__dirname, "../frontend/build");
app.use(express.static(frontendBuildPath));
app.get("/", (_, res) => {
  res.sendFile(path.join(frontendBuildPath, "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));