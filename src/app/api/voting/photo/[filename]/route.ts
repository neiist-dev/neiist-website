import { NextRequest } from "next/server";
import { votingImages } from "@/lib/imageStorage";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  return votingImages.serve((await context.params).filename);
}
