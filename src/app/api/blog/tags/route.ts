import { NextResponse } from "next/server";
import { db_query } from "@/utils/dbUtils";

// Get tags by category
export async function GET() {
  try {
    const { rows } = await db_query("SELECT id, name, category FROM neiist.tags ORDER BY category, name ASC");
    const grouped: Record<string, { id: number, name: string }[]> = {};
    for (const tag of rows) {
      if (!grouped[tag.category]) grouped[tag.category] = [];
      grouped[tag.category].push({ id: tag.id, name: tag.name });
    }
    return NextResponse.json(grouped);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao requisitar tags." }, { status: 500 });
  }
}

// POST /api/blog/tags - create a new tag
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category } = body;
    if (!name || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const exists = await db_query(
      "SELECT id FROM neiist.tags WHERE name = $1 AND category = $2",
      [name, category]
    );
    if (exists.rows.length > 0) {
      return NextResponse.json({ error: "Tag já existe" }, { status: 409 });
    }
    const result = await db_query(
      "INSERT INTO neiist.tags (name, category) VALUES ($1, $2) RETURNING *",
      [name, category]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar tag." }, { status: 500 });
  }
}
