import mongoose from "mongoose";

const InvestorSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: "", trim: true },
    cnic: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    passwordHash: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "verified"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Investor || mongoose.model("Investor", InvestorSchema);
