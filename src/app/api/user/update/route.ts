import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUser, createOrUpdateUser, updateUserPhoto } from "@/utils/dbUtils";

export async function PUT(request: Request) {
  const accessToken = (await cookies()).get('accessToken')?.value;
  
  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const userData = (await cookies()).get('userData')?.value;
    if (!userData) {
      return NextResponse.json({ error: "User data not found" }, { status: 404 });
    }

    const parsedUserData = JSON.parse(userData);
    const updateData = await request.json();

    const existingUser = await getUser(parsedUserData.username);
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let nameUpdated = false;
    let photoUpdated = false;

    if (updateData.name !== undefined && updateData.name.trim() !== '') {
      const trimmedName = updateData.name.trim();
      if (trimmedName !== existingUser.name) {
        const updatedUser = await createOrUpdateUser({
          istid: parsedUserData.username,
          name: trimmedName
        });
        if (updatedUser) {
          nameUpdated = true;
        } else {
          return NextResponse.json({ error: "Failed to update name" }, { status: 500 });
        }
      }
    }

    if (updateData.photo !== undefined && updateData.photo !== '') {
      const photoSuccess = await updateUserPhoto(parsedUserData.username, updateData.photo);
      if (photoSuccess) {
        photoUpdated = true;
      } else {
        return NextResponse.json({ error: "Failed to update photo" }, { status: 500 });
      }
    }

    if (!nameUpdated && !photoUpdated) {
      return NextResponse.json({ error: "No valid changes to update" }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Profile updated successfully",
      updates: {
        name: nameUpdated,
        photo: photoUpdated
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
