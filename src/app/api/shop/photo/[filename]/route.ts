import { NextRequest } from "next/server";
import { productImages } from "@/lib/imageStorage";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  return productImages.serve((await context.params).filename);
}
