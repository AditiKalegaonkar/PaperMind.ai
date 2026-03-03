
import mongoose from "mongoose";
const { Schema } = mongoose;

const MessageSchema = new Schema(
  {
    message: { type: String, required: true },
    answer: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false } 
);

const SessionSchema = new Schema(
  {
    sessionId: { type: String, required: true }, 
    messages: [MessageSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ChatSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sessions: [SessionSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Chat", ChatSchema);
