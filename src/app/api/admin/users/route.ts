import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAllUsers, getUser, createUser } from "@/utils/dbUtils";
import { UserRole, mapRoleToUserRole } from "@/types/user";

async function checkUserListPermission(): Promise<{
  isAuthorized: boolean;
  error?: NextResponse;
}> {
  const accessToken = (await cookies()).get("access_token")?.value;

  if (!accessToken) {
    return {
      isAuthorized: false,
      error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  try {
    const userData = JSON.parse((await cookies()).get("user_data")?.value || "null");
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

    const currentUserRoles = currentUser.roles?.map((role) => mapRoleToUserRole(role)) || [
      UserRole._GUEST,
    ];
    const hasPermission = currentUserRoles.some((role) =>
      [UserRole._ADMIN, UserRole._COORDINATOR, UserRole._MEMBER].includes(role)
    );

    if (!hasPermission) {
      return {
        isAuthorized: false,
        error: NextResponse.json(
          {
            error: "Insufficient permissions - Member, Coordinator or Admin required",
          },
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

async function checkUserCreatePermission(): Promise<{
  isAuthorized: boolean;
  error?: NextResponse;
}> {
  const accessToken = (await cookies()).get("access_token")?.value;

  if (!accessToken) {
    return {
      isAuthorized: false,
      error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  try {
    const userData = JSON.parse((await cookies()).get("user_data")?.value || "null");
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

    const currentUserRoles = currentUser.roles?.map((role) => mapRoleToUserRole(role)) || [
      UserRole._GUEST,
    ];
    const hasPermission = currentUserRoles.some((role) =>
      [UserRole._ADMIN, UserRole._COORDINATOR].includes(role)
    );

    if (!hasPermission) {
      return {
        isAuthorized: false,
        error: NextResponse.json(
          {
            error: "Insufficient permissions - Coordinator or Admin required",
          },
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

export async function GET() {
  const permissionCheck = await checkUserListPermission();
  if (!permissionCheck.isAuthorized) {
    return permissionCheck.error;
  }
  try {
    const users = await getAllUsers();
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const permissionCheck = await checkUserCreatePermission();
  if (!permissionCheck.isAuthorized) {
    return permissionCheck.error;
  }

  try {
    const body = await req.json();
    const { istid, name, email } = body;

    if (!istid || !name || !email) {
      return NextResponse.json(
        { error: "Missing required fields: istid, name, and email are required" },
        { status: 400 }
      );
    }
    const istIdPattern = /^ist\d+$/i;
    if (!istIdPattern.test(istid.trim())) {
      return NextResponse.json(
        { error: "Invalid IST ID format. Must be in format: istXXXXXX" },
        { status: 400 }
      );
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }
    const newUser = await createUser({
      istid: istid.trim(),
      name: name.trim(),
      email: email.trim(),
    });
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    if (error instanceof Error) {
      if (error.message.includes("duplicate") || error.message.includes("unique")) {
        return NextResponse.json(
          { error: "User with this IST ID or email already exists" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
