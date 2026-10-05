import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { verifyPermission } from "@/lib/auth";

function getImageExtension(buffer: Buffer): ".jpg" | ".png" | null {
  const isJpeg =
    buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (isJpeg) return ".jpg";
  const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(pngSig)) return ".png";
  return null;
}

export async function POST(req: NextRequest) {
  const auth = await verifyPermission("shop:write");
  if (auth.error) return auth.error;

  try {
    const form = await req.formData();
    const files = form.getAll("files") as File[];
    const uploadDir = path.join(process.cwd(), "data", "products");
    await fs.mkdir(uploadDir, { recursive: true });

    const paths: string[] = [];
    for (const f of files) {
      const arrayBuffer = await f.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = getImageExtension(buffer);
      if (!ext) return NextResponse.json({ error: "Only image uploads allowed" }, { status: 400 });

      const safeName = `${crypto.randomUUID()}${ext}`;
      const filePath = path.join(uploadDir, safeName);
      await fs.writeFile(filePath, buffer);
      paths.push(`/api/shop/photo/${safeName}`);
    }

    return NextResponse.json({ paths } as { paths: string[] });
  } catch (err) {
    console.error("Upload error", err);
    return NextResponse.json({ error: "Upload failed" } as { error: string }, { status: 500 });
  }
}
