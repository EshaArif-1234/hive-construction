import mongoose from "mongoose";

const PropertyImageSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
    data: { type: Buffer, default: undefined },
    contentType: { type: String, default: "" },
  },
  { _id: false }
);

const PropertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, default: "house", trim: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    totalCost: { type: Number, default: 0 },
    hiveContribution: { type: Number, default: 0 },
    investorFundingRequired: { type: Number, default: 0 },
    expectedSellingPrice: { type: Number, default: 0 },
    expectedProfitPercentage: { type: Number, default: 0 },
    minimumInvestment: { type: Number, default: 0 },
    investorProfitShare: { type: Number, default: 75 },
    hiveProfitShare: { type: Number, default: 25 },
    constructionStatus: {
      type: String,
      enum: [
        "not-started",
        "land-purchased",
        "under-construction",
        "gray-structure-completed",
        "finishing-work",
        "ready-for-sale",
        "sold",
        "completed",
      ],
      default: "not-started",
    },
    expectedCompletionDuration: { type: Number, default: 0 },
    expectedSellingDuration: { type: Number, default: 0 },
    investorProtectionEnabled: { type: Boolean, default: true },
    earlyWithdrawalAllowed: { type: Boolean, default: true },
    earlyWithdrawalProfit: {
      type: String,
      enum: ["no-profit", "partial-profit", "full-profit"],
      default: "no-profit",
    },
    listingStatus: {
      type: String,
      enum: ["draft", "active", "paused", "completed", "archived"],
      default: "draft",
    },
    featured: { type: Boolean, default: false },
    fundingCollected: { type: Number, default: 0 },
    fundingProgressPct: { type: Number, default: 0, min: 0, max: 100 },
    expectedAnnualRoiPct: { type: Number, default: 0 },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    bedrooms: { type: Number, default: 0 },
    bathrooms: { type: Number, default: 0 },
    areaSize: { type: Number, default: 0 },
    garage: { type: Number, default: 0 },
    floorCount: { type: Number, default: 0 },
    nearbySchool: { type: Boolean, default: false },
    nearbyHospital: { type: Boolean, default: false },
    nearbyMarket: { type: Boolean, default: false },
    nearbyMosque: { type: Boolean, default: false },
    thumbnail: { type: PropertyImageSchema, default: () => ({}) },
    galleryImages: { type: [PropertyImageSchema], default: [] },
    createdBy: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.Property || mongoose.model("Property", PropertySchema);
