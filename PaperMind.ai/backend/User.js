// User.js (ES Module)
import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true }, // optional
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: {
      countryCode: { type: String, default: null },
      number: { type: String, unique: true, sparse: true, default: null }
    },
    password: { type: String }, // only for local login
    googleId: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);