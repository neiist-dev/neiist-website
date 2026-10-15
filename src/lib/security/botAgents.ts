import { NextRequest } from "next/server";

export const BOT_USER_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-Web",
  "ClaudeBot",
  "anthropic-ai",
  "Google-Extended",
  "Google-CloudVertex",
  "PerplexityBot",
  "DuckAssistBot",
  "MistralAI-User",
  "LinerBot",
  "QualifiedBot",
  "ICC-Crawler",
  "CCBot",
  "cohere-ai",
  "Amazonbot",
  "AhrefsBot",
  "AhrefsSiteAudit",
  "Bytespider",
  "Diffbot",
  "PetalBot",
  "YandexBot",
  "Applebot-Extended",
  "Meta-ExternalAgent",
  "facebookexternalhit",
  "YouBot",
];

export function isBot(request: NextRequest): boolean {
  const ua = request.headers.get("user-agent")?.toLowerCase() ?? "";
  return BOT_USER_AGENTS.some((bot) => ua.includes(bot.toLowerCase()));
}

export function normalizeIp(ip: string): string {
  const trimmed = ip.trim();
  const clean = trimmed.replace(/^\[|](:\d+)?$/g, "");

  // IPv4 and port
  if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(clean)) return clean.split(":")[0];

  // IPv6 truncating to /64 network
  if (clean.includes(":")) {
    const parts = clean.split(":");
    return parts.length >= 4 ? `${parts.slice(0, 4).join(":")}::/64` : clean;
  }

  return clean;
}

export function getClientIp(request: NextRequest): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return normalizeIp(cfIp);

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return normalizeIp(realIp);

  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const client = xff.split(",")[0]?.trim();
    if (client) return normalizeIp(client);
  }

  return "unknown";
}

export function getClientIdentifier(request: NextRequest, userIdentifier?: string | null): string {
  if (userIdentifier) return `user:${userIdentifier.trim()}`;

  const ip = getClientIp(request);
  const ua = request.headers.get("user-agent")?.slice(0, 48) ?? "";
  const lang = request.headers.get("accept-language")?.split(",")[0]?.slice(0, 10) ?? "";

  if (ip === "unknown" || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("::/64")) {
    const sessionCookie = request.cookies.get("session")?.value;
    if (sessionCookie) return `cookie:${sessionCookie.slice(-16)}`;
    return `fallback:${ua}#${lang}`;
  }

  return `${ip}#${ua}#${lang}`;
}
