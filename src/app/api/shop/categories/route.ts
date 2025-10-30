import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { UserRole } from "@/types/user";
import { getUser, getAllCategories, addCategory } from "@/utils/dbUtils";

async function checkAdminPermission(): Promise<{ isAuthorized: boolean; error?: NextResponse }> {
  const accessToken = (await cookies()).get("access_token")?.value;
  if (!accessToken) {
    return {
      isAuthorized: false,
      error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  try {
    const userDataRaw = (await cookies()).get("user_data")?.value || "null";
    const userData = JSON.parse(userDataRaw);
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
  } catch (err) {
    console.error("Error checking permissions:", err);
    return {
      isAuthorized: false,
      error: NextResponse.json({ error: "Internal server error" }, { status: 500 }),
    };
  }
}

export async function POST(request: NextRequest) {
  const permissionCheck = await checkAdminPermission();
  if (!permissionCheck.isAuthorized) return permissionCheck.error;

  try {
    const { name } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const category = await addCategory(name.trim());
    if (!category) {
      return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }

    return NextResponse.json(
      {
        category: {
          id: category.id,
          name: category.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const categories = await getAllCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
