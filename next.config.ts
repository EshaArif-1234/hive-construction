import type { NextConfig } from "next";

const DEFAULT_ADMIN_EMAIL = "hiveconstruction@admin.com";
const DEFAULT_ADMIN_PASSWORD = "hive@123456";

if (process.env.NODE_ENV === "development") {
  const adminEmail = process.env.ADMIN_SEED_EMAIL || DEFAULT_ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  console.log("[Hive Admin] Seeded / default login (matches DB ensureDefaultAdmin)");
  console.log(`[Hive Admin] email: ${adminEmail}`);
  console.log(`[Hive Admin] password: ${adminPassword}`);
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
