export async function register() {
  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
  const isServerRunning = process.env.NEXT_RUNTIME === "nodejs" && !isBuildPhase;
  if (isServerRunning) {
    await import("@/lib/autoCancelScheduler");
    const { seedSpecialCategories } = await import("@/lib/db/repositories/shop.repository");
    await seedSpecialCategories();
  }
}
