
import { NextResponse } from "next/server";
import { db_query } from "@/utils/dbUtils";


// GET: Listar posts, com opção de pesquisa
// TODO: Para já está apenas a pesquisar pelo título, extender para pesquisar também por descrição e tags (e talvez autor)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const tagsParam = searchParams.get("tags");
    let params: any[] = [];
    
    // Começa com fetch dos posts
    let query = `SELECT id, title, description, image, date, author, created_at, updated_at FROM neiist.posts`;
    let where = '';

    if (search) {
      where = `WHERE LOWER(title) LIKE $1`;
      params.push(`%${search.toLowerCase()}%`);
    }
    query += ' ' + where;
    query += ` ORDER BY date DESC, created_at DESC`;
    const { rows: posts } = await db_query(query, params);
    // Fetch das tags para cada post
    const postIds = posts.map((p: any) => p.id);
    let tagsByPost: Record<number, string[]> = {};
    if (postIds.length > 0) {
      const { rows: tagRows } = await db_query(
        `SELECT pt.post_id, t.name FROM neiist.post_tags pt JOIN neiist.tags t ON pt.tag_id = t.id WHERE pt.post_id = ANY($1)`,
        [postIds]
      );
      for (const { post_id, name } of tagRows) {
        if (!tagsByPost[post_id]) tagsByPost[post_id] = [];
        tagsByPost[post_id].push(name);
      }
    }
    // Filtrar por tags se necessário
    let filteredPosts = posts;
    if (tagsParam) {
      const filterTags = tagsParam.split(',').map(t => t.trim()).filter(Boolean);
      filteredPosts = posts.filter(post => {
        const postTags = tagsByPost[post.id] || [];
        return filterTags.some(tag => postTags.includes(tag));
      });
    }
    // Adicionar as tags ao resultado
    const result = filteredPosts.map(post => ({ ...post, tags: tagsByPost[post.id] || [] }));
    return NextResponse.json(result);
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
    let tagNames: string[] = [];
    try {
      tagNames = tagsRaw ? JSON.parse(tagsRaw as string) : [];
    } catch {
      tagNames = [];
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
    // Inserir post sem tags
    const result = await db_query(
      `INSERT INTO neiist.posts (title, description, image, date, author)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description, imageBase64, date, author]
    );
    const postId = result.rows[0].id;
    // Buscar ids das tags pelo nome
    let tagIds: number[] = [];
    if (tagNames.length > 0) {
      const { rows: tagRows } = await db_query(
        `SELECT id FROM neiist.tags WHERE name = ANY($1)`,
        [tagNames]
      );
      tagIds = tagRows.map((row: any) => row.id);
    }
    // Inserir associações na post_tags
    if (tagIds.length > 0) {
      await Promise.all(tagIds.map(tagId =>
        db_query(`INSERT INTO neiist.post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [postId, tagId])
      ));
    }
    try {
      const { notifySubscribersOfNewPost } = await import("@/utils/notifySubscribers");
      await notifySubscribersOfNewPost({ title: String(title), id: postId });
    } catch (e) {
      console.error("Erro ao notificar subscritores:", e);
    }
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


