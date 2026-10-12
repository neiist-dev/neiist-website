"use server";

import { getAuthenticatedUser } from "@/lib/auth";
import { getBestScore, submitScore } from "@/lib/db/repositories/gameScore.repository";

const MAX_SCORE = 99999; // what the 5-digit HUD can show

export async function getBestScoreAction(): Promise<number | null> {
  const session = await getAuthenticatedUser();
  return session ? getBestScore(session.user.istid) : null;
}

export async function submitScoreAction(score: number): Promise<number | null> {
  const session = await getAuthenticatedUser();
  if (!session) return null;

  if (!Number.isInteger(score) || score < 0 || score > MAX_SCORE) {
    throw new Error("Invalid score");
  }

  return submitScore(session.user.istid, score);
}
