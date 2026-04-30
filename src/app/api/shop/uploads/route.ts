import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

function isImage(buffer: Buffer): boolean {
  const isJpeg =
    buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const isPng = buffer.length >= 8 && buffer.subarray(0, 8).equals(pngSig);
  return isJpeg || isPng;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const files = form.getAll("files") as File[];
    const uploadDir = path.join(process.cwd(), "public", "products");
    await fs.mkdir(uploadDir, { recursive: true });

    const paths: string[] = [];
    for (const f of files) {
      const name = f.name || `upload-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const arrayBuffer = await f.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (!isImage(buffer)) {
        return NextResponse.json({ error: "Only image uploads allowed" }, { status: 400 });
      }

      const safeName = path.basename(name);
      const filePath = path.join(uploadDir, safeName);
      await fs.writeFile(filePath, buffer);
      paths.push(`/products/${safeName}`);
    }

    return NextResponse.json({ paths } as { paths: string[] });
  } catch (err) {
    console.error("Upload error", err);
    return NextResponse.json({ error: "Upload failed" } as { error: string }, { status: 500 });
  }
}
