"use server";

import { requireUser } from "@/lib/auth";
import { submitVotes } from "@/lib/db/repositories/voting.repository";

export async function submitVotesAction(sessionId: number, nomineeIds: string[]): Promise<void> {
  const { user } = await requireUser();

  if (!sessionId || typeof sessionId !== "number") throw new Error("ID de sessão inválido");

  const validNomineeIds = nomineeIds
    .map(String)
    .map((s) => s.trim())
    .filter(Boolean);

  if (validNomineeIds.length === 0) throw new Error("Pelo menos uma opção deve ser selecionada.");

  await submitVotes(sessionId, user.istid, validNomineeIds);
}
