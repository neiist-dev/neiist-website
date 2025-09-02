import { NextResponse } from "next/server";
import { db_query } from "@/utils/dbUtils";

// DELETE /api/blog/tags/category/[category] - remove todas as tags de uma categoria
export async function DELETE(request: Request, context: { params: { category: string } }) {
  try {
    const { category } = context.params;
    if (!category) {
      return NextResponse.json({ error: "Categoria não especificada" }, { status: 400 });
    }
    
    const result = await db_query("DELETE FROM neiist.tags WHERE category = $1 RETURNING *", [decodeURIComponent(category)]);
    
    return NextResponse.json({ success: true, deleted: result.rows.length });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao eliminar categoria." }, { status: 500 });
  }
}
