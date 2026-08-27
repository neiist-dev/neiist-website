export function getSafeReturnUrl(
  raw: string | null | undefined,
  fallback = "/?login=true"
): string {
  if (!raw || typeof raw !== "string") return fallback;

  const trimmed = raw.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    /[\r\n]/.test(trimmed)
  ) {
    return fallback;
  }

  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = new URL(trimmed, base);
    return url.origin === new URL(base).origin ? url.pathname + url.search + url.hash : fallback;
  } catch {
    return fallback;
  }
}
