import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/types/user";
import { handleApiError } from "@/utils/apiErrorUtils";
import { getAllCategories, addCategory } from "@/utils/db/shopQueries";
import { serverCheckRoles } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const userRoles = await serverCheckRoles([UserRole._ADMIN]);
  if (!userRoles.isAuthorized) return userRoles.error;

  try {
    const { name } = await request.json();
    if (!name || !name.trim())
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });

    const category = await addCategory(name.trim());
    if (!category)
      return NextResponse.json({ error: "Failed to create category" }, { status: 500 });

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
    return handleApiError(error);
  }
}

export async function GET() {
  try {
    const categories = await getAllCategories(true);
    return NextResponse.json({ categories });
  } catch (error) {
    return handleApiError(error);
  }
}
