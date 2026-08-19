import mongoose from "mongoose";

const AllocationSchema = new mongoose.Schema(
  {
    investmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Investment", required: true },
    investorId: { type: mongoose.Schema.Types.ObjectId, ref: "Investor", required: true },
    amount: { type: Number, required: true, min: 0 },
    poolSharePct: { type: Number, default: 0 },
    stakeAmount: { type: Number, default: 0 },
  },
  { _id: false }
);

const PropertyProfitDistributionSchema = new mongoose.Schema(
  {
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    totalProjectProfit: { type: Number, required: true, min: 0 },
    investorProfitSharePct: { type: Number, required: true, min: 0, max: 100 },
    hiveProfitSharePct: { type: Number, required: true, min: 0, max: 100 },
    investorPoolAmount: { type: Number, required: true, min: 0 },
    hiveAmount: { type: Number, required: true, min: 0 },
    distributedAt: { type: Date, default: Date.now },
    note: { type: String, default: "", trim: true },
    recordedBy: { type: String, default: "" },
    allocations: { type: [AllocationSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.PropertyProfitDistribution ||
  mongoose.model("PropertyProfitDistribution", PropertyProfitDistributionSchema);
