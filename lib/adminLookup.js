import Admin from "@/models/Admin";

const DEFAULT_ADMIN_EMAIL = "hiveconstruction@admin.com";

/** The single Hive admin account (seed email first, otherwise oldest admin). */
export async function getPrimaryAdmin() {
  const seedEmail = String(process.env.ADMIN_SEED_EMAIL || DEFAULT_ADMIN_EMAIL)
    .toLowerCase()
    .trim();

  const bySeed = await Admin.findOne({ email: seedEmail }).select("_id email").lean();
  if (bySeed) return bySeed;

  return Admin.findOne({}).sort({ createdAt: 1 }).select("_id email").lean();
}

export async function findAdminByLoginOrRecovery(email) {
  const normalized = String(email || "").toLowerCase().trim();
  if (!normalized) return null;

  return Admin.findOne({
    $or: [{ email: normalized }, { recoveryEmail: normalized }],
  })
    .select("_id email recoveryEmail")
    .lean();
}

/** @deprecated Admin reset now sends to any entered email; kept for optional use. */
export function resolveAdminOtpDeliveryEmail(admin, enteredEmail) {
  const entered = String(enteredEmail || "").toLowerCase().trim();
  const login = String(admin?.email || "").toLowerCase().trim();
  const recovery = String(admin?.recoveryEmail || "").toLowerCase().trim();

  if (entered === recovery && recovery) return recovery;
  if (entered === login && recovery) return recovery;
  if (entered === login) return login;
  return recovery || login;
}

export function isUndeliverableMailbox(email) {
  const value = String(email || "").toLowerCase();
  return value.endsWith("@admin.com") || value.endsWith("@localhost") || !value.includes("@");
}
