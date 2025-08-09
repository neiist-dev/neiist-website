
import { NextResponse } from "next/server";
import { db_query } from "@/utils/dbUtils";


// GET: Listar posts, com opção de pesquisa
// TODO: Para já está apenas a pesquisar pelo título, extender para pesquisar também por descrição e tags (e talvez autor)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const tagsParam = searchParams.get("tags");
    let query = `SELECT id, title, description, image, date, author, tags, created_at, updated_at FROM neiist.posts`;
    let params: any[] = [];
    let where = '';

    if (search && tagsParam) {
      const tags = tagsParam.split(',').map(t => t.trim()).filter(Boolean);
      // Só retorna posts que tenham o texto pesquisado no título e pelo menos uma das tags escolhidas.
      where = `WHERE LOWER(title) LIKE $1 AND tags && $2::text[]`;
      params.push(`%${search.toLowerCase()}%`, tags);
    } else if (search) {
      where = `WHERE LOWER(title) LIKE $1`;
      params.push(`%${search.toLowerCase()}%`);
    } else if (tagsParam) {
      const tags = tagsParam.split(',').map(t => t.trim()).filter(Boolean);
      where = `WHERE tags && $1::text[]`;
      params.push(tags);
    }
    query += ' ' + where;
    
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
    const formData = await request.formData();
    const title = formData.get('title');
    const description = formData.get('description');
    const author = formData.get('author');
    const tagsRaw = formData.get('tags');
    let tags: string[] = [];
    try {
      tags = tagsRaw ? JSON.parse(tagsRaw as string) : [];
    } catch {
      tags = [];
    }
    let imageBase64: string | null = null;
    const imageFile = formData.get('image');
    if (imageFile && typeof imageFile === 'object' && 'arrayBuffer' in imageFile) {
      const buffer = await (imageFile as File).arrayBuffer();
      imageBase64 = Buffer.from(buffer).toString('base64');
    }
    if (!title || !description || !author) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const date = new Date().toISOString();
    const result = await db_query(
      `INSERT INTO neiist.posts (title, description, image, date, author, tags)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, description, imageBase64, date, author, tags]
    );
    try {
      const { notifySubscribersOfNewPost } = await import("@/utils/notifySubscribers");
      await notifySubscribersOfNewPost({ title: String(title), id: result.rows[0].id });
    } catch (e) {
      console.error("Erro ao notificar subscritores:", e);
    }
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


