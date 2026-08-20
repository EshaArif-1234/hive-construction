import PasswordReset from "@/models/PasswordReset";

let indexesSynced = false;

/**
 * Drops legacy unique index on email alone and ensures { email, role } compound unique index.
 * Older deployments created passwordresets with a unique email_1 index, which breaks upserts
 * when the same email is used across roles or when role was added later.
 */
export async function ensurePasswordResetIndexes() {
  if (indexesSynced) return;

  const collection = PasswordReset.collection;
  const indexes = await collection.indexes();

  for (const index of indexes) {
    const keys = index.key || {};
    const isLegacyEmailOnly =
      Object.keys(keys).length === 1 &&
      keys.email === 1 &&
      index.name !== "email_1_role_1";

    if (isLegacyEmailOnly && index.unique) {
      await collection.dropIndex(index.name);
    }
  }

  await PasswordReset.syncIndexes();
  indexesSynced = true;
}

export async function upsertPasswordResetOtp({ email, role, otpHash, expiresAt }) {
  await ensurePasswordResetIndexes();

  await PasswordReset.deleteMany({ email, role });
  try {
    await PasswordReset.create({ email, role, otpHash, expiresAt });
  } catch (err) {
    if (err?.code !== 11000) throw err;
    // Legacy documents may still be keyed by email only — clear and retry once.
    await PasswordReset.deleteMany({ email });
    await PasswordReset.create({ email, role, otpHash, expiresAt });
  }
}
