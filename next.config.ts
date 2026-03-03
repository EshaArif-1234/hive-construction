import type { NextConfig } from "next";

if (process.env.NODE_ENV !== "test") {
  // eslint-disable-next-line no-console
  console.log("[Hive Admin] Credentials (fixed)");
  // eslint-disable-next-line no-console
  console.log("[Hive Admin] email: hiveconstruction@admin.com");
  // eslint-disable-next-line no-console
  console.log("[Hive Admin] password: hive@123456");
}

const nextConfig: NextConfig = {
   // output: 'export', 
};

export default nextConfig;
