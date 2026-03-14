import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: {
      countryCode: { type: String, default: null },
      number:      { type: String, unique: true, sparse: true, default: null },
    },
    password: { type: String },            // local auth only
    googleId: { type: String, default: null, sparse: true },
    portfolio: [{ symbol: String, quantity: Number }],
    riskProfile: { type: String, enum: ['Low','Medium','High'], default: 'Medium' },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
