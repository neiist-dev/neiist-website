import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

const UPLOAD_ROOT = path.join(process.cwd(), "data");
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
const ID_PATTERN = /^[\w-]{1,128}$/;
const MIME_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};
const EXTENSIONS = Object.keys(MIME_BY_EXTENSION);

export class ImageUploadError extends Error {}

export interface ImageStoreOptions {
  subDirectory: string;
  publicUrlPrefix: string;
  maxSizeBytes?: number;
  onMutate?: () => void;
}

const exists = (filePath: string) =>
  fs.access(filePath).then(
    () => true,
    () => false
  );

/** Validate size and format, returns the raw bytes and extension. */
async function parseImage(input: File | Buffer, maxSizeBytes: number) {
  const buffer = input instanceof File ? Buffer.from(await input.arrayBuffer()) : input;

  if (buffer.length > maxSizeBytes)
    throw new ImageUploadError(`The size limit is ${maxSizeBytes / 1024 / 1024}MB`);

  const extension = detectExtension(buffer);
  if (!extension) throw new ImageUploadError("Only JPG, JPEG, PNG, WEBP image formats are allowed");

  return { buffer, extension };
}

/**
 * Detects the file extension from magic bytes in the buffer header.
 *
 * @param buffer - raw image buffer
 * @returns file extension with leading dot (`.jpg`, `.png`, `.webp`), or `null`
 */
export function detectExtension(buffer: Buffer): string | null {
  if (buffer.toString("hex", 0, 3) === "ffd8ff") return ".jpg";
  if (buffer.toString("hex", 0, 8) === "89504e470d0a1a0a") return ".png";
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP")
    return ".webp";
  return null;
}

/**
 * Sanitizes and validates an ID or file path.
 *
 * @param input - raw ID, path, or URL string
 * @returns safe ID string, or `null`
 */
export function safeId(input: string): string | null {
  const name = path
    .basename(input.split(/[?#]/)[0])
    .trim()
    .replace(/\.(png|jpe?g|webp)$/i, "");
  return ID_PATTERN.test(name) ? name : null;
}

/**
 * Gets an existing image on disk by UUID.
 *
 * @param subDirectory - folder relative to `UPLOAD_ROOT`
 * @param id - UUID correspondent to the image
 * @returns object with absolute path and file extension, or `null` if not found
 */
export async function findFileById(
  subDirectory: string,
  id: string
): Promise<{ fullPath: string; ext: string } | null> {
  const cleanId = safeId(id);
  if (!cleanId) return null;

  const matches = await Promise.all(
    EXTENSIONS.map(async (ext) => {
      const fullPath = path.join(UPLOAD_ROOT, subDirectory, `${cleanId}${ext}`);
      return (await exists(fullPath)) ? { fullPath, ext } : null;
    })
  );
  return matches.find(Boolean) ?? null;
}

/**
 * Serves an image file from disk as a Next.js response.
 *
 * @param subDirectory - folder relative to `UPLOAD_ROOT`
 * @param id - UUID correspondent to the image
 * @param cacheControl - cache-control header value, defaults to 1 year immutable
 * @returns Next.js response with the image binary and headers
 */
export async function serveImage(
  subDirectory: string,
  id: string,
  cacheControl = "public, max-age=31536000, immutable"
): Promise<NextResponse> {
  const notFound = () => new NextResponse("Image not found", { status: 404 });

  const found = await findFileById(subDirectory, id);
  if (!found) return notFound();

  try {
    const data = await fs.readFile(found.fullPath);
    return new NextResponse(new Uint8Array(data), {
      headers: { "Content-Type": MIME_BY_EXTENSION[found.ext], "Cache-Control": cacheControl },
    });
  } catch {
    return notFound();
  }
}

/**
 * Creates an image storage manager.
 *
 * @param options - configuration options for directory, public URLs, size limits, and mutation hooks
 * @returns store methods (`find`, `url`, `save`, `remove`, `serve`)
 */
export function createImageStore({
  subDirectory,
  publicUrlPrefix,
  maxSizeBytes = DEFAULT_MAX_BYTES,
  onMutate,
}: ImageStoreOptions) {
  const dir = path.join(UPLOAD_ROOT, subDirectory);

  const find = (id: string) => findFileById(subDirectory, id);

  function url(id: string): string {
    const clean = safeId(id);
    return clean ? `${publicUrlPrefix}/${clean}` : "";
  }

  async function save(input: File | Buffer, customId?: string) {
    const { buffer, extension } = await parseImage(input, maxSizeBytes);

    const id = safeId(customId ?? crypto.randomUUID());
    if (!id) throw new ImageUploadError("Image ID is invalid");

    await fs.mkdir(dir, { recursive: true });

    const existing = await find(id);
    if (existing) await fs.rm(existing.fullPath, { force: true });

    await fs.writeFile(path.join(dir, `${id}${extension}`), buffer);
    onMutate?.();

    return { id, url: url(id) };
  }

  async function remove(idOrUrl: string): Promise<void> {
    const found = await find(idOrUrl);
    if (!found) return;
    await fs.rm(found.fullPath, { force: true });
    onMutate?.();
  }

  const serve = (id: string, cacheControl?: string) => serveImage(subDirectory, id, cacheControl);

  return { find, url, save, remove, serve };
}

export const productImages = createImageStore({
  subDirectory: "products",
  publicUrlPrefix: "/api/shop/photo",
});

export const votingImages = createImageStore({
  subDirectory: "voting",
  publicUrlPrefix: "/api/voting/photo",
});

export const userPhotos = createImageStore({
  subDirectory: "user_photos",
  publicUrlPrefix: "/api/user/photo",
  onMutate: () => revalidateTag("users", "max"),
});

export const fenixPhotos = createImageStore({
  subDirectory: "fenix_cache",
  publicUrlPrefix: "/api/user/photo",
});

/**
 * Serves a user photo, fenix cache or custom photo if existent.
 *
 * @param userId - user istid
 * @param cacheControl - cache-control header value, defaults to 1 hour with 1 day stale-while-revalidate
 * @returns Next.js response with the image binary and headers
 */
export async function serveUserPhoto(
  userId: string,
  cacheControl = "public, max-age=3600, stale-while-revalidate=86400"
): Promise<NextResponse> {
  const custom = await userPhotos.find(userId);
  if (custom) return userPhotos.serve(userId, cacheControl);

  const fenix = await fenixPhotos.find(userId);
  if (fenix) return fenixPhotos.serve(userId, cacheControl);

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const response = NextResponse.redirect(new URL("/default_user.png", base), 307);
  response.headers.set("Cache-Control", cacheControl);
  return response;
}
