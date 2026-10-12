import { db_query } from "@/lib/db/connection";

export const getBestScore = async (istid: string): Promise<number> => {
  const {
    rows: [{ get_game_best_score: best }],
  } = await db_query<{ get_game_best_score: number }>(
    `SELECT neiist.get_game_best_score($1) AS get_game_best_score`,
    [istid]
  );
  return best;
};

export const submitScore = async (istid: string, score: number): Promise<number> => {
  const {
    rows: [{ submit_game_score: best }],
  } = await db_query<{ submit_game_score: number }>(
    `SELECT neiist.submit_game_score($1, $2::INT) AS submit_game_score`,
    [istid, score]
  );
  return best;
};
