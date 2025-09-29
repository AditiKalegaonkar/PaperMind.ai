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

import User from "./User.js";
import Chat from "./Chat.js";
import { URL } from "url";

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

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected successfully"))
    .catch(err => {
        console.error("MongoDB connection error:", err);
        process.exit(1);
 
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        touchAfter: 24 * 3600
    }),
    cookie: {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === 'production'
    }
}));

app.use(passport.initialize());
app.use(passport.session());

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ error: "Not authenticated" });
};

app.post("/auth/register", async (req, res) => {
    try {
        const { firstName, email, password } = req.body;
        if (!firstName || !email || !password) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        if (await User.findOne({ email })) {
            return res.status(400).json({ error: "Email already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ firstName, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ error: "Server error during registration" });
    }
});

app.post("/auth/login", async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }
        const user = await User.findOne({ email });
        if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        req.login(user, (err) => {
            if (err) return next(err);
            const userInfo = { id: user._id, firstName: user.firstName, email: user.email };
            res.json({ message: "Logged in successfully", user: userInfo });
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Server error during login" });
    }
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
    process.env.GOOGLE_CALLBACK_URL,
    passport.authenticate("google", { failureRedirect: `${process.env.FRONTEND_URL}/login` }),
    (req, res) => {
        res.redirect(`${process.env.FRONTEND_URL}/userDashboard`);
    }
);

app.post("/auth/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.session.destroy(() => {
            res.clearCookie("connect.sid");
            res.json({ message: "Logged out successfully" });
        });
    });
});

app.get("/auth/user", isAuthenticated, async (req, res) => {
    try {
        const user = { id: req.user._id, firstName: req.user.firstName, email: req.user.email };
        const chats = await Chat.find({ userId: req.user.id }).sort({ "sessions.updatedAt": -1 });
        res.json({ user, chats });
    } catch (err) {
        console.error("Fetch user data error:", err);
        res.status(500).json({ error: "Failed to fetch user data" });
    }
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

app.delete("/chat/:sessionId", isAuthenticated, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;
        const result = await Chat.updateOne(
            { userId },
            { $pull: { sessions: { sessionId: sessionId } } }
        );
        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: "Chat session not found or already deleted" });
        }
        res.json({ message: "Chat session deleted successfully" });
    } catch (err) {
        console.error("Delete chat error:", err);
        res.status(500).json({ error: "Failed to delete chat" });
    }
});

const upload = multer({
    dest: path.join(__dirname, "uploads/"),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});


async function saveChatMessage(userId, sessionId, query, answer) {
    try {
        const messageData = { message: query, answer: JSON.stringify(answer), timestamp: new Date() };
        const updateResult = await Chat.updateOne(
            { userId, "sessions.sessionId": sessionId },
            {
                $push: { "sessions.$.messages": messageData },
                $set: { "sessions.$.updatedAt": new Date() }
            }
        );

        if (updateResult.matchedCount === 0) {
            await Chat.updateOne(
                { userId },
                {
                    $push: {
                        sessions: {
                            sessionId,
                            messages: [messageData],
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }
                    }
                },
                { upsert: true }
            );
        }
    } catch (error) {
        console.error("Error saving chat message:", error);
    }
}

async function analyzeWithFlask(file, query, sessionId, username) {
    // ... (This function remains unchanged)
    const receiveEndpoint = "http://127.0.0.1:5000/receive";
    const resultEndpoint = "http://127.0.0.1:5000/receive_json";

    try {
        const formData = new FormData();
        formData.append("query", query);
        formData.append("session_id", sessionId);
        formData.append("username", username);
        formData.append("filepath", file.path);

        console.log(`Submitting job to Flask /receive with filepath: ${file.path}`);
        const initialResponse = await fetch(receiveEndpoint, {
            method: "POST",
            body: formData,
        });

        if (!initialResponse.ok) {
            const errorText = await initialResponse.text();
            console.error(`Error submitting job to Flask /receive: ${initialResponse.statusText}`, errorText);
            return null;
        }
        console.log("Job successfully submitted. Now polling for results.");

    } catch (error) {
        console.error(`Error connecting to ${receiveEndpoint}:`, error.message);
        return null;
    }

    const pollingTimeout = 60000;
    const pollingInterval = 2000;
    const startTime = Date.now();

    while (Date.now() - startTime < pollingTimeout) {
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
        try {
            console.log(`Polling ${resultEndpoint}...`);
            const resultResponse = await fetch(resultEndpoint);

            if (resultResponse.status === 204) {
                console.log("Job is still processing (received 204 No Content)...");
                continue;
            }

            if (resultResponse.ok) {
                const resultJson = await resultResponse.json();
                console.log("Successfully retrieved JSON result from Flask.");
                return resultJson;
            } else {
                console.warn(`Polling attempt failed with status: ${resultResponse.statusText}`);
            }
        } catch (error) {
            console.error(`Error during polling of ${resultEndpoint}:`, error.message);
        }
    }

    console.error("Polling for Flask result timed out after 60 seconds.");
    return null;
}

app.post("/receive", isAuthenticated, upload.single("document"), async (req, res) => {
    const file = req.file;
    try {
        // CHANGED: Use 'let' to allow modification
        let { query, session_id } = req.body;

        if (!query || session_id === undefined) { // Check for undefined, not just falsy
            return res.status(400).json({ error: "Query and session_id are required" });
        }
        if (!file) {
            return res.status(400).json({ error: "PDF file is required" });
        }

        const userId = req.user.id;
        const username = req.user.firstName;
        
        // CHANGED: Handle new chat creation
        const isNewChat = session_id === '-1';
        if (isNewChat) {
            session_id = new mongoose.Types.ObjectId().toString(); // Generate new ID
        }

        let flaskResult = await analyzeWithFlask(file, query, session_id, username);

        if (!flaskResult) {
            flaskResult = {
                analysis_steps: [{ agent: "System", text: `Flask service is unavailable. Could not analyze '${file.originalname}'. Please ensure the Python server is running.` }],
                status: "mock_response"
            };
        }
        
        // CHANGED: Ensure the correct session_id (new or existing) is in the response
        const response = { ...flaskResult, session_id: session_id };

        // CHANGED: Save all chats, new or existing
        await saveChatMessage(userId, session_id, query, response);

        res.json(response);

    } catch (err) {
        console.error("Analysis error:", err);
        res.status(500).json({ error: "Analysis failed", details: err.message });
    } finally {
        if (file) fs.unlink(file.path, err => err && console.error("Failed to delete temp file:", err));
    }

app.post("/chat", isAuthenticated, async (req, res) => {
    try {
        // CHANGED: Use 'let' to allow modification
        let { query, session_id } = req.body;

        if (!query || session_id === undefined) {
            return res.status(400).json({ error: "Query and session_id are required" });
        }

        const userId = req.user.id;
        
        // CHANGED: Handle new chat creation
        const isNewChat = session_id === '-1';
        if (isNewChat) {
            session_id = new mongoose.Types.ObjectId().toString(); // Generate new ID
        }

        const response = {
            answer: `This is a text-only response to your query: "${query}"`,
            timestamp: new Date(),
            // CHANGED: Return the correct (new or existing) session_id
            session_id: session_id
        };

        // CHANGED: Save all chats, new or existing
        await saveChatMessage(userId, session_id, query, response);

        res.json(response);

    } catch (err) {
        console.error("Chat error:", err);
        res.status(500).json({ error: "Chat processing failed" });
    }
});
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));

app.use((error, req, res, next) => {
    console.error("Unhandled error:", error);
    res.status(500).json({ error: "Internal server error" });
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

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});