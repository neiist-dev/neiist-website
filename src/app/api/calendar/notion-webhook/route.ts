import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { triggerDebouncedCalendarSync } from "@/lib/redis/queue";

export async function POST(req: NextRequest) {
  const bodyText = await req.text();
  const verificationToken = process.env.VERIFICATION_TOKEN;
  if (!verificationToken) {
    console.error("[Notion Webhook] VERIFICATION_TOKEN is not configured");
    return new NextResponse("Webhook not configured", { status: 500 });
  }

  const signatureHeader =
    req.headers.get("X-Notion-Signature") || req.headers.get("x-notion-signature") || "";
  const calculatedSignature =
    "sha256=" +
    crypto.createHmac("sha256", verificationToken).update(bodyText, "utf8").digest("hex");
  try {
    if (
      !signatureHeader ||
      !crypto.timingSafeEqual(Buffer.from(calculatedSignature), Buffer.from(signatureHeader))
    ) {
      return new NextResponse("Invalid signature", { status: 401 });
    }
  } catch {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  // Redis-backed debounced synchronization
  await triggerDebouncedCalendarSync("notion_webhook", 5000);

  return NextResponse.json({
    ok: true,
    queued: true,
    message: "Sync scheduled via Redis",
  });
}
