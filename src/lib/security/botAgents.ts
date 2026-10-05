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

export function getClientIp(request: NextRequest): string {
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const client = xff.split(",")[0]?.trim();
    if (client) return client;
  }

  return "unknown";
}
