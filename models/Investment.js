import mongoose from "mongoose";

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
    status: {
      type: String,
      enum: ["active", "withdrawn", "completed"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Investment || mongoose.model("Investment", InvestmentSchema);
