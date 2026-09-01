import mongoose from "mongoose";
import { EXIT_REQUEST_STATUSES, EXIT_REQUEST_TYPES } from "@/lib/exitRequestConstants";

const PayoutSnapshotSchema = new mongoose.Schema(
  {
    principal: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    ruleNumber: { type: String, default: "" },
    ruleId: { type: String, default: "" },
  },
  { _id: false }
);

const ExitRequestSchema = new mongoose.Schema(
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
    requestType: {
      type: String,
      enum: EXIT_REQUEST_TYPES,
      required: true,
    },
    status: {
      type: String,
      enum: EXIT_REQUEST_STATUSES,
      default: "pending",
      index: true,
    },
    reason: { type: String, default: "", trim: true },
    adminNote: { type: String, default: "", trim: true },
    requestedPayout: { type: PayoutSnapshotSchema, default: () => ({}) },
    exitPlanSnapshot: {
      scenarioKey: { type: String, default: "" },
      scenarioTitle: { type: String, default: "" },
      investmentAgeDays: { type: Number, default: 0 },
      withinFirstYear: { type: Boolean, default: false },
    },
    securityChequeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SecurityCheque",
      default: null,
    },
    reviewedBy: { type: String, default: "" },
    reviewedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ExitRequestSchema.index({ investorId: 1, status: 1, createdAt: -1 });
ExitRequestSchema.index({ investmentId: 1, status: 1 });

export default mongoose.models.ExitRequest || mongoose.model("ExitRequest", ExitRequestSchema);
