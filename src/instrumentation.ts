export async function register() {
  const isServerRunning =
    process.env.NEXT_RUNTIME === "nodejs" && process.env.NEXT_PHASE !== "phase-production-build";
  if (isServerRunning) {
    await import("@/lib/autoCancelScheduler");
    const { seedSpecialCategories } = await import("@/lib/db/repositories/shop.repository");
    await seedSpecialCategories();
  }
}
