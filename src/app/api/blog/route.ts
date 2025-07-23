import { NextResponse } from "next/server";
import { db_query } from "@/lib/db";

// GET: List all posts
export async function GET() {
  try {
    const { rows } = await db_query(
      `SELECT id, title, description, image, date, author, tag, created_at, updated_at
       FROM neiist.news
       ORDER BY date DESC, created_at DESC`
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create new post
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, image, date, author, tag } = body;
    if (!title || !description || !author) {
      //! Decide which fields are required
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const result = await db_query(
      `INSERT INTO neiist.news (title, description, image, date, author, tag)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, description, image, date, author, tag]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error creating news:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


