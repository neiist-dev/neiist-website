
import { NextResponse } from "next/server";
import { db_query } from "@/utils/dbUtils";


// GET: Listar posts, com opção de pesquisa
// TODO: Para já está apenas a pesquisar pelo título, extender para pesquisar também por descrição e tags (e talvez autor)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    let query = `SELECT id, title, description, image, date, author, tags, created_at, updated_at FROM neiist.posts`;
    let params: any[] = [];
    if (search) {
      query += ` WHERE LOWER(title) LIKE $1`;
      params.push(`%${search.toLowerCase()}%`);
    }
    query += ` ORDER BY date DESC, created_at DESC`;
    const { rows } = await db_query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Criar um novo post
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, image, date, author, tags } = body;
    if (!title || !description || !author) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const result = await db_query(
      `INSERT INTO neiist.posts (title, description, image, date, author, tags)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, description, image, date, author, tags]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


