import { db_query } from "@/utils/dbUtils";
import { NextResponse } from "next/server";

// GET /api/authors - Lista todos os autores existentes
export async function GET() {
  try {
    const { rows } = await db_query("SELECT id, name FROM neiist.authors ORDER BY name ASC");
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar autores" }, { status: 500 });
  }
}
