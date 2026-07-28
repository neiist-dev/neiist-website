import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/types/user";
import { handleApiError } from "@/utils/apiErrorUtils";
import { getAllUsers, createUser } from "@/utils/db/userQueries";
import { serverCheckRoles } from "@/lib/auth";

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
  } catch (error) {
    return handleApiError(error);
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
    return handleApiError(error);
  }
}
