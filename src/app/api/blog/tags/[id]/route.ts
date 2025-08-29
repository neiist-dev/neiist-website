import { NextResponse } from "next/server";
import { db_query } from "@/utils/dbUtils";

// PATCH /api/blog/tags/[id] - update tag name
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: "Missing tag name" }, { status: 400 });
    }
    
    const { id } = params;
    const result = await db_query(
      "UPDATE neiist.tags SET name = $1 WHERE id = $2 RETURNING *",
      [name, id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Tag não encontrada" }, { status: 404 });
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar tag." }, { status: 500 });
  }
}

// DELETE /api/blog/tags/[id] - remove tag by id
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    
    const { id } = params;
    
    const result = await db_query("DELETE FROM neiist.tags WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Tag não encontrada" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao eliminar tag." }, { status: 500 });
  }
}