import dns from "dns";
import mongoose from "mongoose";
import fs from "fs";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

function readEnv(name) {
  const text = fs.readFileSync(".env", "utf8");
  const re = new RegExp(`^${name}=(.+)$`, "m");
  return re.exec(text)?.[1]?.trim() || "";
}

const newEmail = process.argv[2]?.trim().toLowerCase();

if (!newEmail || !newEmail.includes("@")) {
  console.error("Usage: node scripts/set-admin-email.mjs your.email@example.com");
  process.exit(1);
}

const uri = readEnv("MONGODB_URI");
if (!uri) {
  console.error("MONGODB_URI not found in .env");
  process.exit(1);
}

const AdminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

const Admin = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);

await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000, family: 4 });

const updated = await Admin.findOneAndUpdate(
  {},
  { email: newEmail },
  { new: true, sort: { createdAt: 1 } }
).select("email");

await mongoose.disconnect();

if (!updated) {
  console.error("No admin account found in MongoDB.");
  process.exit(1);
}

console.log("Admin email updated to:", updated.email);
console.log("Use this email on the admin forgot-password page.");
