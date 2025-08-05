
import { NextResponse } from "next/server";
import { db_query } from "@/utils/dbUtils";


// GET /api/blog/[id] - Post por id
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const { rows } = await db_query(
      `SELECT id, title, description, image, date, author, tags, created_at, updated_at
       FROM neiist.posts WHERE id = $1`,
      [id]
    );
    if (!rows[0]) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
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
    const author = formData.get('author');
    let tags = formData.get('tags');
    
    // array PostgreSQL
    if (typeof tags === 'string') {
      try {
        const arr = JSON.parse(tags);
        if (Array.isArray(arr)) {
          // Formato PostgreSQL: {tag1,tag2,tag3}
          tags = '{' + arr.map(tag => String(tag).replace(/(["{}])/g, '')).join(',') + '}'; // TODO - Encontrar outra forma de lidar com o array
        }
      } catch (e) {
      }
    }

    let imageUrl = null;
    // Se imagem foi enviada, processa aqui (exemplo: salva em pasta/public, retorna url)
    const image = formData.get('image');
    if (image && typeof image === 'object' && 'arrayBuffer' in image) {
      imageUrl = `/public/uploads/TODO`;
      // TODO
    }

    const query = `UPDATE neiist.posts SET title = $1, description = $2, author = $3, tags = $4, updated_at = NOW()${imageUrl ? ', image = $5' : ''} WHERE id = $${imageUrl ? 6 : 5} RETURNING *`;
    const paramsArr = imageUrl
      ? [title, description, author, tags, imageUrl, id]
      : [title, description, author, tags, id];

    const { rows } = await db_query(query, paramsArr);
    if (!rows[0]) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
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
