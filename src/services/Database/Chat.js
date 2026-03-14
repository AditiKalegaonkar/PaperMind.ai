import mongoose from "mongoose";
const { Schema } = mongoose;

const MessageSchema = new Schema(
  {
    message: { type: String, required: true },
    answer:  { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SessionSchema = new Schema(
  {
    sessionId:    { type: String, required: true },
    adkSessionId: { type: String, default: null },   // ADK / SQLite session ID
    title:        { type: String, default: null },   // user-editable display name
    messages:     [MessageSchema],
    createdAt:    { type: Date, default: Date.now },
    updatedAt:    { type: Date, default: Date.now },
  },
  { _id: false }
);

const ChatSchema = new Schema(
  {
    userId:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    sessions: [SessionSchema],
  },
  { timestamps: true }
);

// Compound index for fast session lookups
ChatSchema.index({ userId: 1, "sessions.sessionId": 1 });

export default mongoose.model("Chat", ChatSchema);