import mongoose from "mongoose";

const PropertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    images: {
      type: [
        {
          data: { type: Buffer, default: null },
          contentType: { type: String, default: "" },
        },
      ],
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
