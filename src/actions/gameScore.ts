"use server";

import { getAuthenticatedUser } from "@/lib/auth";
import { getBestScore, submitScore } from "@/lib/db/repositories/gameScore.repository";

const gameStarts = new Map<string, number>();

export async function getBestScoreAction(): Promise<number | null> {
  const session = await getAuthenticatedUser();
  return session ? getBestScore(session.user.istid) : null;
}

export async function startGameAction(): Promise<void> {
  const session = await getAuthenticatedUser();
  if (session) gameStarts.set(session.user.istid, Date.now());
}

export async function submitScoreAction(score: number): Promise<number | null> {
  const session = await getAuthenticatedUser();
  if (!session) return null;

  const startTime = gameStarts.get(session.user.istid);
  gameStarts.delete(session.user.istid);

  if (!startTime) return null;

  const elapsedSeconds = (Date.now() - startTime) / 1000;
  if (!Number.isInteger(score) || score < 0 || score > elapsedSeconds * 22 + 10) return null;

  return submitScore(session.user.istid, score);
}
