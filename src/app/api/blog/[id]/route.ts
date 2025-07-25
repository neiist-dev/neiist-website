
import { NextResponse } from "next/server";
import { db_query } from "@/utils/dbUtils";

// GET /api/blog/[id] - Get a single post by id
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const { rows } = await db_query(
      `SELECT id, title, description, image, date, author, tags, created_at, updated_at
       FROM neiist.news WHERE id = $1`,
      [id]
    );
    if (!rows[0]) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error fetching news by id:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/blog/[id] - Delete a post by id
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const { rowCount } = await db_query(
      `DELETE FROM neiist.news WHERE id = $1`,
      [id]
    );
    if (rowCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting news:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
