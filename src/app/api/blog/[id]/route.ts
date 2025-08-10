
import { NextResponse } from "next/server";
import { db_query } from "@/utils/dbUtils";


// GET /api/blog/[id] - Post por id
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const { rows } = await db_query(
      `SELECT id, title, description, image, date, created_at, updated_at
       FROM neiist.posts WHERE id = $1`,
      [id]
    );
    if (!rows[0]) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    // Buscar tags associadas
    const { rows: tagRows } = await db_query(
      `SELECT t.name FROM neiist.post_tags pt JOIN neiist.tags t ON pt.tag_id = t.id WHERE pt.post_id = $1`,
      [id]
    );
    const tags = tagRows.map((row: any) => row.name);
    // Fetch de autores associados
    const { rows: authorRows } = await db_query(
      `SELECT a.name FROM neiist.post_authors pa JOIN neiist.authors a ON pa.author_id = a.id WHERE pa.post_id = $1`,
      [id]
    );
    const authors = authorRows.map((row: any) => row.name);
    return NextResponse.json({ ...rows[0], tags, authors });
  } catch (error) {
    console.error("Error fetching post by id:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/blog/[id] - Atualiza post por id
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const formData = await request.formData();
    const title = formData.get('title');
    const description = formData.get('description');
  const authorsRaw = formData.get('authors');
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

    let authorNames: string[] = [];
    try {
      authorNames = authorsRaw ? JSON.parse(authorsRaw as string) : [];
    } catch {
      authorNames = [];
    }
    if (authorNames.length === 0) {
      return NextResponse.json({ error: "Pelo menos 1 autor é obrigatório" }, { status: 400 });
    }
    let query = `UPDATE neiist.posts SET title = $1, description = $2, updated_at = NOW()`;
    const paramsArr: any[] = [title, description];
    if (imageBase64) {
      query += ', image = $3';
      paramsArr.push(imageBase64);
      query += ' WHERE id = $4 RETURNING *';
      paramsArr.push(id);
    } else {
      query += ' WHERE id = $3 RETURNING *';
      paramsArr.push(id);
    }
    const { rows } = await db_query(query, paramsArr);
    if (!rows[0]) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    // Atualizar autores na tabela de associação
    // Fetch dos ids dos autores pelo nome (criar se não existirem)
    let authorIds: number[] = [];
    for (const name of authorNames) {
      const { rows: found } = await db_query(`SELECT id FROM neiist.authors WHERE name = $1`, [name]);
      let authorId;
      if (found.length > 0) {
        authorId = found[0].id;
      } else {
        const { rows: inserted } = await db_query(`INSERT INTO neiist.authors (name) VALUES ($1) RETURNING id`, [name]);
        authorId = inserted[0].id;
      }
      authorIds.push(authorId);
    }
    // Remover associações antigas
    await db_query(`DELETE FROM neiist.post_authors WHERE post_id = $1`, [id]);
    // Criar novas associações
    await Promise.all(authorIds.map(authorId =>
      db_query(`INSERT INTO neiist.post_authors (post_id, author_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [id, authorId])
    ));
    // Atualizar tags na tabela de associação
    // Fetch dos ids das tags pelo nome
    let tagIds: number[] = [];
    if (tagNames.length > 0) {
      const { rows: tagRows } = await db_query(
        `SELECT id FROM neiist.tags WHERE name = ANY($1)`,
        [tagNames]
      );
      tagIds = tagRows.map((row: any) => row.id);
    }
    // Remover associações antigas
    await db_query(`DELETE FROM neiist.post_tags WHERE post_id = $1`, [id]);
    // Inserir novas associações
    if (tagIds.length > 0) {
      await Promise.all(tagIds.map(tagId =>
        db_query(`INSERT INTO neiist.post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [id, tagId])
      ));
    }
    // Fetch tags e autores atualizados
    const { rows: tagRows2 } = await db_query(
      `SELECT t.name FROM neiist.post_tags pt JOIN neiist.tags t ON pt.tag_id = t.id WHERE pt.post_id = $1`,
      [id]
    );
    const tags = tagRows2.map((row: any) => row.name);
    const { rows: authorRows2 } = await db_query(
      `SELECT a.name FROM neiist.post_authors pa JOIN neiist.authors a ON pa.author_id = a.id WHERE pa.post_id = $1`,
      [id]
    );
    const authors = authorRows2.map((row: any) => row.name);
    return NextResponse.json({ ...rows[0], tags, authors });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/blog/[id]
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const { rowCount } = await db_query(
      `DELETE FROM neiist.posts WHERE id = $1`,
      [id]
    );
    if (rowCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
