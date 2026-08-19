import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/types/user";
import { handleApiError } from "@/utils/apiErrorUtils";
import { addTeam, removeTeam, getAllTeams } from "@/lib/db/repositories/team.repository";
import { serverCheckRoles } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function GET() {
  const userRoles = await serverCheckRoles([UserRole._ADMIN]);
  if (!userRoles.isAuthorized) {
    return userRoles.error;
  }
  try {
    const teams = await getAllTeams();
    const transformedTeams = teams.map((team) => ({
      ...team,
      active: true, // Since getAllTeams only returns active teams
    }));
    return NextResponse.json(transformedTeams);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  const userRoles = await serverCheckRoles([UserRole._ADMIN]);
  if (!userRoles.isAuthorized) {
    return userRoles.error;
  }
  try {
    const { name, description } = await request.json();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const success = await addTeam(name, description || "");
    if (success) {
      revalidatePath("/about-us");
      revalidatePath("/departments-management");
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to add team" }, { status: 500 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const userRoles = await serverCheckRoles([UserRole._ADMIN]);
  if (!userRoles.isAuthorized) {
    return userRoles.error;
  }
  try {
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const success = await removeTeam(name);
    if (success) {
      revalidatePath("/about-us");
      revalidatePath("/departments-management");
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to remove team" }, { status: 500 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
