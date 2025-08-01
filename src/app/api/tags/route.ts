import { NextResponse } from "next/server";
import { db_query } from "@/utils/dbUtils";

export async function GET() {
  try {
    const { rows } = await db_query("SELECT id, name, category FROM neiist.tags ORDER BY category, name ASC");
    const grouped: Record<string, { id: number, name: string }[]> = {};
    for (const tag of rows) {
      if (!grouped[tag.category]) grouped[tag.category] = [];
      grouped[tag.category].push({ id: tag.id, name: tag.name });
    }
    return NextResponse.json(grouped);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao requisitar tags." }, { status: 500 });
  }
}
