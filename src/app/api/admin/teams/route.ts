import { NextRequest, NextResponse } from "next/server";
import { addTeam, removeTeam, getAllTeams } from "@/utils/dbUtils";
import { UserRole } from "@/types/user";
import { serverCheckRoles } from "@/utils/permissionUtils";

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
  } catch {
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
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
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to add team" }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: "Failed to add team" }, { status: 500 });
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
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to remove team" }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: "Failed to remove team" }, { status: 500 });
  }
}
