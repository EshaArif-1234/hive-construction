import mongoose from "mongoose";

const PasswordResetSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["investor", "admin"],
      default: "investor",
    },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

PasswordResetSchema.index({ email: 1, role: 1 }, { unique: true });

export default mongoose.models.PasswordReset || mongoose.model("PasswordReset", PasswordResetSchema);
