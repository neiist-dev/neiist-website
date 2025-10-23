import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { UserRole } from "@/types/user";
import { Event } from "@/types/events";
import { addEvent, getAllEvents, getUser } from "@/utils/dbUtils";
import path from "path";
import fs from "fs/promises";

async function checkAdminPermission(): Promise<{ isAuthorized: boolean; error?: NextResponse }> {
  const accessToken = (await cookies()).get("accessToken")?.value;
  if (!accessToken) {
    return {
      isAuthorized: false,
      error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  try {
    const userData = JSON.parse((await cookies()).get("userData")?.value || "null");
    if (!userData) {
      return {
        isAuthorized: false,
        error: NextResponse.json({ error: "User data not found" }, { status: 404 }),
      };
    }

    const currentUser = await getUser(userData.istid);
    if (!currentUser) {
      return {
        isAuthorized: false,
        error: NextResponse.json({ error: "Current user not found" }, { status: 404 }),
      };
    }

    // Roles are already mapped in getUser/mapdbUserToUser
    const isAdmin = currentUser.roles.includes(UserRole._ADMIN);

    if (!isAdmin) {
      return {
        isAuthorized: false,
        error: NextResponse.json(
          { error: "Insufficient permissions - Admin required" },
          { status: 403 }
        ),
      };
    }
    return { isAuthorized: true };
  } catch (error) {
    console.error("Error checking permissions:", error);
    return {
      isAuthorized: false,
      error: NextResponse.json({ error: "Internal server error" }, { status: 500 }),
    };
  }
}

function sanitizeImageName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  return base.endsWith(".jpg") ? base : `${base}.jpg`;
}

export async function GET() {
  const permissionCheck = await checkAdminPermission();
  if (!permissionCheck.isAuthorized) return permissionCheck.error;
  try {
    const events = await getAllEvents();
    return NextResponse.json(events);
  } catch {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const permissionCheck = await checkAdminPermission();
  if (!permissionCheck.isAuthorized) return permissionCheck.error;

  try {
    const { title, description, imageBase64, imageName } = await request.json();

    if (!title || !description || !imageBase64 || !imageName) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const buffer = Buffer.from(imageBase64, "base64");
    const uploadDir = path.join(process.cwd(), "public", "events");
    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, sanitizeImageName(imageName));
    await fs.writeFile(filePath, buffer);

    const eventData: Partial<Event> = {
      title,
      description,
      image: sanitizeImageName(imageName),
    };
    const event = await addEvent(eventData);
    if (!event) {
      return NextResponse.json({ error: "Failed to save event" }, { status: 500 });
    }
    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
