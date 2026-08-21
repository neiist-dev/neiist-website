import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { validateIstId } from "@/utils/apiValidationUtils";

export async function GET(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const [userId, error] = validateIstId((await context.params).userId, "userId");
  if (error) return error;

  const isCustom = request.nextUrl.searchParams.has("custom");

  try {
    if (isCustom) {
      const customPath = path.join(process.cwd(), "data", "user_photos", `${userId}.png`);
      try {
        const imageBuffer = await fs.readFile(customPath);
        return new NextResponse(new Uint8Array(imageBuffer), {
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
      return new NextResponse(new Uint8Array(imageBuffer), {
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
