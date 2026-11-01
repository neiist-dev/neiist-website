import { NextRequest, NextResponse } from "next/server";
import { verifyPermission } from "@/lib/auth";
import { ImageUploadError, productImages } from "@/lib/imageStorage";

export async function POST(req: NextRequest) {
  const auth = await verifyPermission("shop:write");
  if (auth.error) return auth.error;

  try {
    const files = (await req.formData()).getAll("files") as File[];
    if (files.length === 0)
      return NextResponse.json({ error: "No files provided" }, { status: 400 });

    const uploadedImages = await Promise.all(files.map((file) => productImages.save(file)));
    const ids = uploadedImages.map((image) => image.id);
    const paths = uploadedImages.map((image) => image.url);
    return NextResponse.json({ paths, ids });
  } catch (error) {
    if (error instanceof ImageUploadError)
      return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
