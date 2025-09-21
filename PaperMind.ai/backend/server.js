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

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept common document types
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

app.post("/analyze", isAuthenticated, upload.single("document"), (req, res) => {
  let tempFilePath = '';
  
  try {
    const { query } = req.body;
    const file = req.file;
    const userId = req.session.user?.id || req.user?.id;

    console.log('Analyze request received:', {
      query: query || 'No query provided',
      fileName: file?.originalname || 'No file',
      userId: userId || 'No user ID'
    });

    if (!file) {
      return res.status(400).json({ 
        error: "No document uploaded",
        details: "No document file was uploaded." 
      });
    }

    if (!query || query.trim() === '') {
      // Clean up uploaded file if query is missing
      fs.unlink(file.path, (err) => {
        if (err) console.error(`Failed to delete file: ${err}`);
      });
      return res.status(400).json({ 
        error: "Query required",
        details: "Please provide a query for document analysis." 
      });
    }

    if (!userId) {
      // Clean up uploaded file if user not authenticated
      fs.unlink(file.path, (err) => {
        if (err) console.error(`Failed to delete file: ${err}`);
      });
      return res.status(401).json({ 
        error: "Authentication error",
        details: "Could not identify user from session." 
      });
    }

    tempFilePath = file.path;

    // Construct absolute path to Python script
    const pythonScriptPath = path.resolve(__dirname, "..", "python-backend", "agent.py");
    
    console.log('Python script path:', pythonScriptPath);
    
    // Check if Python script exists
    if (!fs.existsSync(pythonScriptPath)) {
      throw new Error(`Python script not found at: ${pythonScriptPath}`);
    }

    // Spawn Python process
    const pythonProcess = spawn("python", [pythonScriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.dirname(pythonScriptPath) // Set working directory to python-backend
    });
    
    const dataForPython = {
      userId: userId.toString(),
      query: query.trim(),
      path: path.resolve(tempFilePath) // Send absolute path
    };

    console.log('Sending data to Python:', dataForPython);

    // Send data to Python script
    pythonProcess.stdin.write(JSON.stringify(dataForPython));
    pythonProcess.stdin.end();

    let pythonOutput = "";
    let pythonError = "";

    pythonProcess.stdout.on("data", (data) => {
      const output = data.toString();
      console.log('Python stdout:', output);
      pythonOutput += output;
    });

    pythonProcess.stderr.on("data", (data) => {
      const error = data.toString();
      console.log('Python stderr:', error);
      pythonError += error;
    });

    // Set timeout for Python process
    const timeout = setTimeout(() => {
      pythonProcess.kill('SIGTERM');
      console.log('Python process timed out');
    }, 300000); // 5 minutes timeout

    pythonProcess.on("close", (code) => {
      clearTimeout(timeout);
      console.log(`Python process exited with code ${code}`);
      
      // Clean up temporary file
      fs.unlink(tempFilePath, (err) => {
        if (err) console.error(`Failed to delete temp file: ${err}`);
        else console.log(`Deleted temp file: ${tempFilePath}`);
      });

      if (code === 0) {
        try {
          // Try to parse the output as JSON first
          let response;
          try {
            response = JSON.parse(pythonOutput.trim());
          } catch (e) {
            // If not JSON, treat as plain text
            response = pythonOutput.trim();
          }
          
          res.status(200).json({ 
            success: true,
            response: response,
            message: "Document analyzed successfully"
          });
        } catch (error) {
          console.error('Error processing Python output:', error);
          res.status(500).json({ 
            error: "Processing error",
            details: "Error processing analysis results." 
          });
        }
      } else {
        console.error('Python script error:', pythonError);
        res.status(500).json({ 
          error: "Analysis failed",
          details: `Python script error: ${pythonError || 'Unknown error'}`,
          code: code
        });
      }
    });

    pythonProcess.on("error", (error) => {
      clearTimeout(timeout);
      console.error('Failed to start Python process:', error);
      
      // Clean up temporary file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlink(tempFilePath, (err) => {
          if (err) console.error(`Failed to delete temp file on error: ${err}`);
        });
      }
      
      res.status(500).json({ 
        error: "Process error",
        details: "Failed to start document analysis process." 
      });
    });

  } catch (error) {
    console.error("Server error in /analyze:", error);
    
    // Clean up temporary file on error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlink(tempFilePath, (err) => {
        if (err) console.error(`Failed to delete temp file on error: ${err}`);
      });
    }
    
    res.status(500).json({ 
      error: "Server error",
      details: "An unexpected server error occurred." 
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve frontend static files
const frontendBuildPath = path.join(__dirname, "../frontend/build");
if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendBuildPath, "index.html"));
  });
} else {
  console.warn("Frontend build directory not found:", frontendBuildPath);
  app.get("/", (req, res) => {
    res.json({ message: "Backend is running, but frontend build not found." });
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});