import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".avif":
      return "image/avif";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  const { filename } = await context.params;
  const decoded = decodeURIComponent(filename);
  const safeName = path.basename(decoded);

  if (!safeName || safeName === "." || safeName === "..")
    return new NextResponse("Invalid file name", { status: 400 });

  const filePath = path.join(process.cwd(), "data", "products", safeName);

  try {
    const imageBuffer = await fs.readFile(filePath);
    return new NextResponse(new Uint8Array(imageBuffer), {
      status: 200,
      headers: {
        "Content-Type": getMimeType(safeName),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Product photo not found", { status: 404 });
  }
}
