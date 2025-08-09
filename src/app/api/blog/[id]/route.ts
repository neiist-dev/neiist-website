
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
    
    // array PostgreSQL para conversão de tags
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

    let imageBase64: string | null = null;
    const imageFile = formData.get('image');
    if (imageFile && typeof imageFile === 'object' && 'arrayBuffer' in imageFile) {
      const buffer = await (imageFile as File).arrayBuffer();
      imageBase64 = Buffer.from(buffer).toString('base64');
    }

    let query = `UPDATE neiist.posts SET title = $1, description = $2, author = $3, tags = $4, updated_at = NOW()`;
    const paramsArr: any[] = [title, description, author, tags];
    if (imageBase64) {
      query += ', image = $5';
      paramsArr.push(imageBase64);
      query += ' WHERE id = $6 RETURNING *';
      paramsArr.push(id);
    } else {
      query += ' WHERE id = $5 RETURNING *';
      paramsArr.push(id);
    }
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
