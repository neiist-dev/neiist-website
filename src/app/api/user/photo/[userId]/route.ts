import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

// Only allow alphanumeric istids, adjust regex as needed for your use case
function isValidIstId(id: string) {
  return /^[a-zA-Z0-9]+$/.test(id);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    // Validate userId to prevent path traversal
    if (!isValidIstId(userId)) {
      return new NextResponse("Invalid userId", { status: 400 });
    }

    const url = new URL(request.url);
    const isCustom = url.searchParams.has("custom");

    if (isCustom) {
      const customPath = path.join(process.cwd(), "data", "user_photos", `${userId}.png`);
      try {
        const imageBuffer = await fs.readFile(customPath);
        return new NextResponse(imageBuffer, {
          status: 200,
          headers: { "Content-Type": "image/png" },
        });
      } catch {
        return new NextResponse("Custom photo not found", { status: 404 });
      }
    }

    const fenixCachePath = path.join(process.cwd(), "data", "fenix_cache", `${userId}.png`);
    try {
      const imageBuffer = await fs.readFile(fenixCachePath);
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: { "Content-Type": "image/png" },
      });
    } catch {
      return new NextResponse("Photo not found", { status: 404 });
    }
  } catch (error) {
    console.error("Error in photo API:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
