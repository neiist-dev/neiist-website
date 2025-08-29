import { db_query } from "@/utils/dbUtils";
import { NextResponse } from "next/server";

// GET, PUT, DELETE para /api/blog/authors/[id]
export async function GET(request: Request, context: { params: { id: string } }) {
  const { id } = await context.params;
  
  try {
    const { rows } = await db_query("SELECT id, name, email, photo FROM neiist.authors WHERE id = $1", [id]);
    if (rows.length === 0) return NextResponse.json({ error: "Autor não encontrado" }, { status: 404 });
    
    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar autor" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: { id: string } }) {
  const { id } = await context.params;
  
  try {
    const { name, email, photo } = await request.json();
    
    const { rows } = await db_query(
      "UPDATE neiist.authors SET name = $1, email = $2, photo = $3 WHERE id = $4 RETURNING id, name, email, photo",
      [name, email, photo, id]
    );
    
    if (rows.length === 0) return NextResponse.json({ error: "Autor não encontrado" }, { status: 404 });
    
    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar autor" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  const { id } = await context.params;
  
  try {
    await db_query("DELETE FROM neiist.authors WHERE id = $1", [id]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    
    return NextResponse.json({ error: "Erro ao remover autor" }, { status: 500 });
  }
}
