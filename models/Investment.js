import mongoose from "mongoose";

const ProfitDistributionSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    distributedAt: { type: Date, default: Date.now },
    note: { type: String, default: "", trim: true },
    recordedBy: { type: String, default: "" },
  },
  { _id: true }
);

const InvestmentSchema = new mongoose.Schema(
  {
    investorId: { type: mongoose.Schema.Types.ObjectId, ref: "Investor", required: true },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    amount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["bank-transfer", "easypaisa", "jazzcash"],
      default: "bank-transfer",
    },
    paymentScreenshotName: { type: String, default: "" },
    investmentDate: { type: Date, default: Date.now },
    sharePercentage: { type: Number, default: 0 },
    profitAmount: { type: Number, default: 0 },
    profitDistributions: { type: [ProfitDistributionSchema], default: [] },
    lastProfitDistributedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["active", "withdrawn", "completed"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Investment || mongoose.model("Investment", InvestmentSchema);
