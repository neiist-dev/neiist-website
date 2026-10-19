import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { verifyPermission } from "@/lib/auth";
import {
  getVotingSessionById,
  getSessionResults,
  getSessionVotesLog,
} from "@/lib/db/repositories/voting.repository";

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await verifyPermission("voting:read");
  if (auth.error) return auth.error;

  const { sessionId: rawSessionId } = await params;
  const sessionId = parseInt(rawSessionId, 10);
  if (isNaN(sessionId)) {
    return NextResponse.json({ error: "ID de sessão inválido" }, { status: 400 });
  }

  const [session, results, votesLog] = await Promise.all([
    getVotingSessionById(sessionId),
    getSessionResults(sessionId),
    getSessionVotesLog(sessionId),
  ]);

  if (!session) {
    return NextResponse.json({ error: "Sessão de votação não encontrada" }, { status: 404 });
  }

  const totalChoicesCast = results.reduce((sum, r) => sum + Number(r.voteCount), 0);
  const totalVoters = session.totalVotes;

  const resumoData = [
    ["Propriedade", "Valor"],
    ["ID da Sessão", session.id],
    ["Título", session.name],
    ["Descrição", session.description || "—"],
    ["Tipo de Votação", session.type],
    ["Estado", session.status],
    ["Escolhas por Votante", session.maxChoices ?? 1],
    ["Início", session.startAt ? new Date(session.startAt).toISOString() : "—"],
    ["Fim", session.endAt ? new Date(session.endAt).toISOString() : "—"],
    ["Total de Votantes Distintos", totalVoters],
    ["Total de Escolhas Registadas", totalChoicesCast],
    ["Resultados Públicos", session.showResults ? "Sim" : "Não"],
    ["Data de Exportação", new Date().toISOString()],
  ];

  const resultadosData = results.map((r, index) => {
    const pct = totalVoters > 0 ? ((Number(r.voteCount) / totalVoters) * 100).toFixed(2) : "0.00";
    return {
      Posição: index + 1,
      "ID da Opção": r.nomineeId,
      "Nome / Título": r.nomineeName,
      Descrição: r.description || "",
      "Votos Recebidos": Number(r.voteCount),
      "Percentagem (%)": `${pct}%`,
    };
  });

  const logData = votesLog.map((log) => ({
    "Data e Hora": log.votedAt.toISOString(),
    "ID da Opção": log.nomineeId,
    "Nome da Opção": log.nomineeName,
  }));

  const wb = XLSX.utils.book_new();
  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
  const wsResultados = XLSX.utils.json_to_sheet(resultadosData, {
    header: [
      "Posição",
      "ID da Opção",
      "Nome / Título",
      "Descrição",
      "Votos Recebidos",
      "Percentagem (%)",
    ],
  });
  const wsLog = XLSX.utils.json_to_sheet(logData, {
    header: ["Data e Hora", "ID da Opção", "Nome da Opção"],
  });

  wsResumo["!cols"] = [{ wch: 30 }, { wch: 50 }];
  wsResultados["!cols"] = [
    { wch: 10 },
    { wch: 25 },
    { wch: 35 },
    { wch: 40 },
    { wch: 15 },
    { wch: 15 },
  ];
  wsLog["!cols"] = [{ wch: 25 }, { wch: 25 }, { wch: 35 }];

  XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");
  XLSX.utils.book_append_sheet(wb, wsResultados, "Resultados");
  XLSX.utils.book_append_sheet(wb, wsLog, "Registo de Votos");

  const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const sanitizedName =
    session.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase() || "sessao";

  return new NextResponse(excelBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="votacao_${session.id}_${sanitizedName}.xlsx"`,
    },
  });
}
