import { NextRequest, NextResponse } from "next/server";
import { getAllUsers, createUser } from "@/utils/dbUtils";
import { UserRole } from "@/types/user";
import { serverCheckRoles } from "@/utils/permissionUtils";

export async function GET() {
  const userRoles = await serverCheckRoles([
    UserRole._MEMBER,
    UserRole._COORDINATOR,
    UserRole._ADMIN,
  ]);
  if (!userRoles.isAuthorized) {
    return userRoles.error;
  }
  try {
    const users = await getAllUsers();
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userRoles = await serverCheckRoles([
    UserRole._COORDINATOR,
    UserRole._SHOP_MANAGER,
    UserRole._ADMIN,
  ]);
  if (!userRoles.isAuthorized) {
    return userRoles.error;
  }

  try {
    const body = await request.json();
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
