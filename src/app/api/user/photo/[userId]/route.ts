import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { validateIstId } from "@/utils/apiValidationUtils";
import { ImageUploadError, serveUserPhoto, userPhotos } from "@/lib/imageStorage";
import { getAuthenticatedUser } from "@/lib/auth";
import { hasPermission } from "@/lib/security/permissions";
import { getUser } from "@/lib/db/repositories/user.repository";
import { handleApiError } from "@/utils/apiErrorUtils";

export async function GET(_request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const [userId, error] = validateIstId((await context.params).userId, "userId");
  if (error) return error;

  return serveUserPhoto(userId);
}

export async function POST(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const session = await getAuthenticatedUser();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const [userId, error] = validateIstId((await context.params).userId, "userId");
  if (error) return error;

  try {
    const currentUser = session.user;
    const targetUser = await getUser(userId);
    if (!targetUser) return NextResponse.json({ error: "Target user not found" }, { status: 404 });

    const canWritePhoto =
      hasPermission(currentUser, "photos:write_global") ||
      (hasPermission(currentUser, "photos:write_dept") &&
        targetUser.teams?.some((team) =>
          hasPermission(currentUser, "photos:write_dept", { department: team })
        ));
    if (!canWritePhoto)
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

    const file = (await request.formData()).get("file");
    if (!(file instanceof File))
      return NextResponse.json({ error: "No file provided" }, { status: 400 });

    await userPhotos.save(file, userId);

    revalidatePath("/about-us");
    revalidatePath("/management");
    revalidatePath("/profile");
    return NextResponse.json({ success: true, photo: userPhotos.url(userId) });
  } catch (error) {
    if (error instanceof ImageUploadError)
      return NextResponse.json({ error: error.message }, { status: 400 });

    return handleApiError(error);
  }
}
