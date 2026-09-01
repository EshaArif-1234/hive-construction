import mongoose from "mongoose";

export const NOTIFICATION_TYPES = [
  "investment",
  "property-status",
  "profit-share",
  "security",
  "account",
  "exit",
];

const InvestorNotificationSchema = new mongoose.Schema(
  {
    investorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Investor",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", default: null },
    investmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Investment", default: null },
    link: { type: String, default: "", trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
    readAt: { type: Date, default: null, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

InvestorNotificationSchema.index({ investorId: 1, createdAt: -1 });

export default mongoose.models.InvestorNotification ||
  mongoose.model("InvestorNotification", InvestorNotificationSchema);
