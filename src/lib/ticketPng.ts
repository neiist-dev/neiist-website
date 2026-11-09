import sharp from "sharp";
import { generateTicketSvg } from "./ticketCode";

/**
 * Rasterize ticket SVG into PNG buffer for emails (Server-only).
 */
export async function generateTicketPNG(ticketCode: string, size = 520): Promise<Buffer> {
  const svg = generateTicketSvg(ticketCode, size);
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9, quality: 100 }).toBuffer();
}
