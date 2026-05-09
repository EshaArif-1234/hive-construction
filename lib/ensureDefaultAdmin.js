import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";

const DEFAULT_EMAIL = "hiveconstruction@admin.com";
const DEFAULT_PASSWORD = "hive@123456";

/**
 * Ensures the primary admin row exists (matches former fixed credentials).
 * Uses ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD when set; otherwise defaults above.
 *
 * MongoDB: collection name is `admins` (Mongoose pluralizes model "Admin").
 * Stored fields: email, passwordHash (bcrypt), createdAt, updatedAt — plaintext password is never stored.
 */
export async function ensureDefaultAdmin() {
  await dbConnect();

  const email = String(process.env.ADMIN_SEED_EMAIL || DEFAULT_EMAIL)
    .toLowerCase()
    .trim();
  const password = String(process.env.ADMIN_SEED_PASSWORD || DEFAULT_PASSWORD);

  const existing = await Admin.findOne({ email }).select("_id").lean();
  if (existing) return;

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await Admin.create({ email, passwordHash });
    console.log(
      `[Hive Admin] MongoDB → collection "admins": inserted document for "${email}".`
    );
    console.log(
      "[Hive Admin] Stored fields: email, passwordHash (bcrypt), timestamps — not the plain password."
    );
  } catch (e) {
    if (e?.code === 11000) return;
    throw e;
  }
}
