export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  await import("./lib/setupMongoDns");

  try {
    const { ensureDefaultAdmin } = await import("./lib/ensureDefaultAdmin");
    await ensureDefaultAdmin();
  } catch (err) {
    console.error(
      "[Hive Admin] Startup: could not ensure default admin in MongoDB (check MONGODB_URI and network).",
      err
    );
  }
}
