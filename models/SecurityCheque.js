import mongoose from "mongoose";

const SecurityChequeSchema = new mongoose.Schema(
  {
    investmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Investment",
      required: true,
      index: true,
    },
    investorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Investor",
      required: true,
      index: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },
    chequeNumber: { type: String, required: true, trim: true },
    bankName: { type: String, default: "", trim: true },
    accountHolder: { type: String, default: "", trim: true },
    principalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "PKR", trim: true },
    issueDate: { type: Date, required: true },
    maturityDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["pending", "active", "presented", "cleared", "cancelled", "bounced", "expired"],
      default: "pending",
      index: true,
    },
    settlementType: {
      type: String,
      enum: ["none", "early-withdrawal", "project-completion", "loss-scenario", "other"],
      default: "none",
    },
    settledAt: { type: Date, default: null },
    settlementNote: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    recordedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

SecurityChequeSchema.index({ investorId: 1, status: 1 });
SecurityChequeSchema.index({ propertyId: 1, status: 1 });

export default mongoose.models.SecurityCheque ||
  mongoose.model("SecurityCheque", SecurityChequeSchema);
