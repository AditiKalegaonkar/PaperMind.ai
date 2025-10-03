import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import bcrypt from "bcryptjs";
import passport from "passport"; // Use the main passport library
import { Strategy as LocalStrategy } from "passport-local"; // Import the LocalStrategy
import { Strategy as GoogleStrategy } from "passport-google-oauth20"; // Import the GoogleStrategy
import fetch from "node-fetch";

import User from "./User.js";
import Chat from "./Chat.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Environment Variables ---
const { MONGO_URI, SESSION_SECRET, PORT, FRONTEND_URL, GOOGLE_CALLBACK, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
if (!MONGO_URI || !SESSION_SECRET || !PORT || !FRONTEND_URL || !GOOGLE_CALLBACK || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error("FATAL ERROR: Missing required environment variables in .env file.");
    process.exit(1);
}

// --- Middleware ---
app.use(express.json());
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
}));

// --- MongoDB Connection ---
mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB connected successfully"))
    .catch(err => { console.error("MongoDB connection error:", err); process.exit(1); });

// --- Session Configuration ---
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URI }),
    cookie: {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        secure: false,
        sameSite: 'lax'
    }
}));

// --- Passport Initialization ---
app.use(passport.initialize());
app.use(passport.session());

// --- START: PASSPORT AUTHENTICATION LOGIC ---

// 1. Define the Local Strategy for username/password authentication
passport.use(new LocalStrategy(
    {
        usernameField: 'email',
        passwordField: 'password'
    },
    async (email, password, done) => {
        try {
            const user = await User.findOne({ email: email.toLowerCase() });
            if (!user) {
                return done(null, false, { message: 'Incorrect email or password.' });
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return done(null, false, { message: 'Incorrect email or password.' });
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }
));

// 2. Define the Google OAuth 2.0 Strategy
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK
},
async (accessToken, refreshToken, profile, done) => {
    try {
        // Find a user who has previously logged in with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
            // If user found, log them in
            return done(null, user);
        } else {
            // If no user found with this Google ID, find one by email
            user = await User.findOne({ email: profile.emails[0].value });
            if (user) {
                // If a user exists with that email, link the Google ID to their account
                user.googleId = profile.id;
                await user.save();
                return done(null, user);
            } else {
                // If no user exists, create a new user account
                const newUser = new User({
                    googleId: profile.id,
                    firstName: profile.name.givenName,
                    email: profile.emails[0].value,
                    // Note: No password is set for OAuth users
                });
                await newUser.save();
                return done(null, newUser);
            }
        }
    } catch (err) {
        return done(err, null);
    }
}));


// 3. Configure Session Management (Serialization)
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// --- END: PASSPORT AUTHENTICATION LOGIC ---


// --- Auth Middleware (Relies on Passport) ---
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ error: "Not authenticated" });
};

// --- Multer for File Uploads ---
const upload = multer({
    dest: path.join(__dirname, "uploads"),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed"));
        }
    }
});

// --- Helper Functions ---
async function saveChatMessage(userId, sessionId, query, responsePayload) {
    const messageData = { message: query, answer: JSON.stringify(responsePayload), timestamp: new Date() };
    try {
        const updateResult = await Chat.updateOne(
            { userId, "sessions.sessionId": sessionId },
            { $push: { "sessions.$.messages": messageData }, $set: { "sessions.$.updatedAt": new Date() } }
        );
        if (updateResult.matchedCount === 0) {
            await Chat.updateOne(
                { userId },
                { $push: { sessions: { sessionId, messages: [messageData], createdAt: new Date(), updatedAt: new Date() } } },
                { upsert: true }
            );
        }
    } catch (err) {
        console.error("Error saving chat message:", err);
    }
}

async function analyzeWithFlask(file, query, sessionId, username) {
    const receiveEndpoint = "http://127.0.0.1:6000/receive";
    const resultEndpoint = "http://127.0.0.1:6000/receive_json";
    try {
        const formData = new FormData();
        formData.append("query", query);
        formData.append("session_id", sessionId);
        formData.append("username", username);
        formData.append("file_path", file.path);
        const initRes = await fetch(receiveEndpoint, { method: "POST", body: formData });
        if (!initRes.ok) {
            console.error("Flask /receive endpoint returned an error:", await initRes.text());
            return null;
        }
    } catch (err) {
        console.error("Error connecting to Flask /receive endpoint:", err);
        return null;
    }
    const pollingInterval = 30000;
    const pollingTimeout = 10 * 60 * 1000;
    const startTime = Date.now();
    while (Date.now() - startTime < pollingTimeout) {
        await new Promise(r => setTimeout(r, pollingInterval));
        try {
            const resultRes = await fetch(resultEndpoint);
            if (resultRes.status === 204) continue;
            if (resultRes.ok) return await resultRes.json();
        } catch (err) {
            console.error("Polling error:", err.message);
        }
    }
    console.error("Polling for Flask result timed out.");
    return null;
}

// --- Auth Routes ---
app.post("/auth/register", async (req, res) => {
    try {
        const { firstName, email, password } = req.body;
        if (!firstName || !email || !password) return res.status(400).json({ error: "All fields are required" });
        if (await User.findOne({ email })) return res.status(409).json({ error: "Email already exists" });
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ firstName, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ error: "Server error during registration" });
    }
});

app.post("/auth/login", (req, res, next) => {
    // This route now works because the 'local' strategy is defined above
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ error: info.message || "Invalid credentials" });
        req.login(user, (err) => {
            if (err) return next(err);
            const userInfo = { id: user._id, firstName: user.firstName, email: user.email };
            return res.json({ message: "Logged in successfully", user: userInfo });
        });
    })(req, res, next);
});

app.post("/auth/logout", (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        req.session.destroy(() => {
            res.clearCookie("connect.sid", { path: "/" });
            res.json({ message: "Logged out successfully" });
        });
    });
});

app.get("/auth/user", isAuthenticated, async (req, res) => {
    try {
        const user = { id: req.user._id, firstName: req.user.firstName, email: req.user.email };
        const chatDoc = await Chat.findOne({ userId: req.user.id });
        const chats = chatDoc ? [chatDoc] : [];
        res.json({ user, chats });
    } catch (err) {
        console.error("Fetch user error:", err);
        res.status(500).json({ error: "Failed to fetch user data" });
    }
});

// Google OAuth
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get(GOOGLE_CALLBACK,
    passport.authenticate("google", { failureRedirect: `${FRONTEND_URL}/login` }),
    (req, res) => res.redirect(`${FRONTEND_URL}/userDashboard`)
);

// --- Chat Routes ---
app.post("/receive", isAuthenticated, upload.single("document"), async (req, res) => {
    const file = req.file;
    try {
        let { query, session_id } = req.body;
        const userId = req.user.id;
        const username = req.user.firstName;
        if (!query || session_id === undefined) return res.status(400).json({ error: "Query and session_id are required" });
        if (!file) return res.status(400).json({ error: "A PDF file is required" });

        // --- START: Refactored Session Logic ---
        let isNewChat = true;
        let sessionIdForFlask = "-1";
        if (session_id && session_id !== "-1") {
            const chat = await Chat.findOne({ userId, "sessions.sessionId": session_id });
            if (chat) {
                isNewChat = false;
                sessionIdForFlask = session_id;
            } else {
                // The session ID was provided but not found, so treat it as a new chat.
                console.log(`Session ID ${session_id} not found for user ${userId}. Treating as new session for Flask.`);
            }
        }
        // If session_id was "-1" or a temporary ID, isNewChat remains true and sessionIdForFlask remains "-1".
        // --- END: Refactored Session Logic ---

        // Call Flask with the determined session ID. This will be "-1" for all new chats.
        const flaskResult = await analyzeWithFlask(file, query, sessionIdForFlask, username);

        // Determine the final session ID for saving in our database.
        let finalSessionId;
        if (isNewChat) {
            // If it was a new chat, use the ID from Flask if it provides one, otherwise generate a new one.
            finalSessionId = flaskResult?.session_id || new mongoose.Types.ObjectId().toString();
        } else {
            // If it was an existing chat, continue using the original session_id.
            finalSessionId = session_id;
        }

        // Format the response payload for the frontend
        let responsePayload;
        if (flaskResult) {
            responsePayload = {
                session_id: finalSessionId,
                analysis_steps: [{ agent: "PDF Analyzer", text: flaskResult.summary || "Analysis complete." }],
                code: flaskResult.code || null
            };
        } else {
            responsePayload = {
                session_id: finalSessionId,
                analysis_steps: [{ agent: "System", text: `Flask service is unavailable or timed out. Could not analyze '${file.originalname}'` }],
                code: null
            };
        }

        await saveChatMessage(userId, finalSessionId, query, responsePayload);
        res.json(responsePayload);
    } catch (err) {
        console.error("Analysis error:", err);
        res.status(500).json({ error: "Analysis failed", details: err.message });
    } finally {
        if (file) fs.unlink(file.path, err => err && console.error("Failed to delete temp file:", err));
    }
});

app.post("/chat", isAuthenticated, async (req, res) => {
    try {
        let { query, session_id } = req.body;
        const userId = req.user.id;
        if (!query || session_id === undefined) return res.status(400).json({ error: "Query and session_id required" });

        let finalSessionId = session_id;

        // If the session ID is not explicitly for a new chat, verify it exists.
        if (session_id && session_id !== "-1") {
            const chat = await Chat.findOne({ userId, "sessions.sessionId": session_id });
            // If the session doesn't exist for this user, treat it as a new chat.
            if (!chat) {
                console.log(`Session ID ${session_id} not found for user ${userId} in /chat. Creating a new session.`);
                finalSessionId = new mongoose.Types.ObjectId().toString();
            }
        } else {
            // If the frontend signals a new chat (session_id is -1 or missing), generate a new ID.
            finalSessionId = new mongoose.Types.ObjectId().toString();
        }

        const response = { session_id: finalSessionId, analysis_steps: [{ agent: "System", text: `This is a text-only response: ${query}` }], code: null };
        await saveChatMessage(userId, finalSessionId, query, response);
        res.json(response);
    } catch (err) {
        console.error("Chat error:", err);
        res.status(500).json({ error: "Chat failed" });
    }
});

app.get("/chat/:sessionId", isAuthenticated, async (req, res) => {
    try {
        const chat = await Chat.findOne({ userId: req.user.id, "sessions.sessionId": req.params.sessionId }, { "sessions.$": 1 });
        if (!chat || !chat.sessions.length) return res.status(404).json({ error: "Chat not found" });
        res.json({ session: chat.sessions[0] });
    } catch (err) {
        console.error("Fetch chat error:", err);
        res.status(500).json({ error: "Failed to fetch chat" });
    }
});

app.delete("/chat/:sessionId", isAuthenticated, async (req, res) => {
    try {
        const result = await Chat.updateOne({ userId: req.user.id }, { $pull: { sessions: { sessionId: req.params.sessionId } } });
        if (!result.modifiedCount) return res.status(404).json({ error: "Chat not found" });
        res.json({ message: "Chat deleted" });
    } catch (err) {
        console.error("Delete chat error:", err);
        res.status(500).json({ error: "Delete failed" });
    }
});

// --- Server Health & Error Handling ---
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: "An unexpected server error occurred." }); });

// --- Start Server ---
app.listen(PORT, () => console.log(`Server running on port ${PORT}. Accepting connections from ${FRONTEND_URL}.`));