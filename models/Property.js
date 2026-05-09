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
    images: {
      type: [PropertyImageSchema],
      default: [],
    },
    location: { type: String, required: true, trim: true },
    totalCost: { type: Number, required: true },
    constructionCost: { type: Number, required: true },
    landCost: { type: Number, required: true },
    status: {
      type: String,
      enum: ["available", "sold", "in-progress"],
      default: "available",
    },
    expectedSalePrice: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Property || mongoose.model("Property", PropertySchema);
