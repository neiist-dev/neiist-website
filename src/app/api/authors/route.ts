import { db_query } from "@/utils/dbUtils";
import { NextResponse } from "next/server";

// GET /api/authors - Lista todos os autores existentes
export async function GET() {
    try {
        const { rows } = await db_query("SELECT id, name, email, photo FROM neiist.authors ORDER BY name ASC");
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error: "Erro ao buscar autores" }, { status: 500 });
    }
}

// POST /api/authors - Adiciona um novo autor
export async function POST(request: Request) {
    try {
        const { name, email, photo } = await request.json();
        if (!name || !email) {
        return NextResponse.json({ error: "Nome e email são obrigatórios" }, { status: 400 });
        }
        const { rows } = await db_query(
        "INSERT INTO neiist.authors (name, email, photo) VALUES ($1, $2, $3) RETURNING id, name, email, photo",
        [name, email, photo]
        );
        return NextResponse.json(rows[0]);
    } catch (error) {
        return NextResponse.json({ error: "Erro ao criar autor" }, { status: 500 });
    }
}