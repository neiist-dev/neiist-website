import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { verifyPermission } from "@/lib/auth";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), "data", "voting");

function getImageExtension(buffer: Buffer): ".jpg" | ".png" | ".webp" | null {
  if (buffer.length < 4) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return ".jpg";
  const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(pngSig)) return ".png";
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString() === "RIFF" &&
    buffer.subarray(8, 12).toString() === "WEBP"
  )
    return ".webp";
  return null;
}

export async function POST(req: NextRequest) {
  const auth = await verifyPermission("voting:write");
  if (auth.error) return auth.error;

  try {
    const form = await req.formData();
    const files = form.getAll("files") as File[];
    if (files.length === 0)
      return NextResponse.json({ error: "No files provided" }, { status: 400 });

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const paths: string[] = [];
    for (const f of files) {
      if (f.size > MAX_IMAGE_SIZE)
        return NextResponse.json({ error: "Image exceeds 5MB" }, { status: 400 });

      const buffer = Buffer.from(await f.arrayBuffer());
      const ext = getImageExtension(buffer);
      if (!ext)
        return NextResponse.json({ error: "Only JPEG, PNG and WebP allowed" }, { status: 400 });

      const safeName = `${crypto.randomUUID()}${ext}`;
      await fs.writeFile(path.join(UPLOAD_DIR, safeName), buffer);
      paths.push(`/api/voting/photo/${safeName}`);
    }

    return NextResponse.json({ paths });
  } catch (err) {
    console.error("Upload error", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
