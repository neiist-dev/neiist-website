import {
  DbSessionResult,
  DbVotingNominee,
  DbVotingSession,
  SessionResult,
  VotingNominee,
  VotingSession,
  mapDbSessionResult,
  mapDbVotingNominee,
  mapDbVotingSession,
} from "@/types/voting";

import { db_query } from "@/utils/db/dbClient";

export const addVotingSession = async (
  input: Partial<VotingSession>
): Promise<VotingSession | null> => {
  const {
    rows: [row],
  } = await db_query<DbVotingSession>(
    `SELECT * FROM neiist.create_voting_session($1, $2, $3, $4, $5, $6, $7)`,
    [
      input.name,
      input.description ?? null,
      input.type,
      input.nomineeIds,
      input.activityId ?? null,
      input.startAt ?? null,
      input.endAt ?? null,
    ]
  );
  return row ? mapDbVotingSession(row) : null;
};

export const updateVotingSession = async (
  sessionId: number,
  input: Partial<VotingSession>
): Promise<VotingSession | null> => {
  const {
    rows: [row],
  } = await db_query<DbVotingSession>(
    `SELECT * FROM neiist.update_voting_session($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      sessionId,
      input.name,
      input.description ?? null,
      input.type,
      input.nomineeIds,
      input.activityId ?? null,
      input.startAt ?? null,
      input.endAt ?? null,
    ]
  );
  return row ? mapDbVotingSession(row) : null;
};

export const getVotingSessions = async (limit = 20): Promise<VotingSession[]> => {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : 20;
  const { rows } = await db_query<DbVotingSession>(`SELECT * FROM neiist.get_voting_sessions($1)`, [
    safeLimit,
  ]);
  return rows.map(mapDbVotingSession);
};

export const getVotingSessionById = async (sessionId: number): Promise<VotingSession | null> => {
  const {
    rows: [row],
  } = await db_query<DbVotingSession>(`SELECT * FROM neiist.get_voting_session_by_id($1)`, [
    sessionId,
  ]);
  return row ? mapDbVotingSession(row) : null;
};

export const getSessionNominees = async (sessionId: number): Promise<VotingNominee[]> => {
  const { rows } = await db_query<DbVotingNominee>(
    `SELECT * FROM neiist.get_session_nominees($1)`,
    [sessionId]
  );
  return rows.map(mapDbVotingNominee);
};

export const startVoting = async (sessionId: number): Promise<void> => {
  await db_query(`SELECT neiist.start_voting($1)`, [sessionId]);
};

export const submitVote = async (
  sessionId: number,
  voterIstid: string,
  nomineeId: string
): Promise<void> => {
  await db_query(`SELECT neiist.submit_vote($1, $2, $3)`, [sessionId, voterIstid, nomineeId]);
};

export const finishVoting = async (sessionId: number): Promise<void> => {
  await db_query(`SELECT neiist.finish_voting($1)`, [sessionId]);
};

export const deleteVotingSession = async (sessionId: number): Promise<void> => {
  await db_query(`SELECT neiist.delete_voting_session($1)`, [sessionId]);
};

export const getSessionResults = async (sessionId: number): Promise<SessionResult[]> => {
  const { rows } = await db_query<DbSessionResult>(`SELECT * FROM neiist.get_session_results($1)`, [
    sessionId,
  ]);
  return rows.map(mapDbSessionResult);
};

export const getUserVote = async (
  sessionId: number,
  voterIstid: string
): Promise<string | null> => {
  const {
    rows: [row],
  } = await db_query<{ nominee_id: string }>(`SELECT * FROM neiist.get_user_vote($1, $2)`, [
    sessionId,
    voterIstid,
  ]);
  return row?.nominee_id ?? null;
};
