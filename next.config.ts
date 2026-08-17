import type { NextConfig } from "next";

const DEFAULT_ADMIN_EMAIL = "hiveconstruction@admin.com";
const DEFAULT_ADMIN_PASSWORD = "hive@123456";

if (process.env.NODE_ENV === "development") {
  const adminEmail = process.env.ADMIN_SEED_EMAIL || DEFAULT_ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  console.log("[Hive Admin] Default seed credentials (used only when admin account is first created):");
  console.log(`[Hive Admin] email: ${adminEmail}`);
  console.log(`[Hive Admin] seed password: ${adminPassword}`);
  console.log("[Hive Admin] If you changed the password in Settings, use that new password — it is not shown here (only a bcrypt hash is stored in MongoDB).");
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
    localPatterns: [
      {
        pathname: "/api/properties/**/image",
      },
      {
        pathname: "/api/properties/*/image",
      },
    ],
  },
   // output: 'export', 
};

export default nextConfig;
