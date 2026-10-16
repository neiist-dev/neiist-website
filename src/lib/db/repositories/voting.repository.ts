import {
  DbSessionResult,
  DbVotingNominee,
  DbVotingSession,
  GlobalVotingState,
  mapCustomOptionToDb,
  mapDbSessionResult,
  mapDbVotingNominee,
  mapDbVotingSession,
  SessionResult,
  VotingNominee,
  VotingSession,
  VOTING_STATUS,
} from "@/types/voting";

import { db_query } from "@/lib/db/connection";

export const addVotingSession = async (
  input: Partial<VotingSession>
): Promise<VotingSession | null> => {
  const customOpts = input.customOptions;
  const nominees =
    customOpts && customOpts.length > 0
      ? customOpts.map(mapCustomOptionToDb)
      : (input.nomineeIds ?? []);

  const {
    rows: [row],
  } = await db_query<DbVotingSession>(
    `SELECT * FROM neiist.create_voting_session($1, $2, $3, $4::JSONB, $5, $6, $7)`,
    [
      input.name,
      input.description ?? null,
      input.type,
      JSON.stringify(nominees),
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

export const setSessionShowResults = async (
  sessionId: number,
  showResults: boolean
): Promise<void> => {
  await db_query(`SELECT neiist.set_session_show_results($1, $2)`, [sessionId, showResults]);
};

export const getGlobalVotingState = async (): Promise<GlobalVotingState> => {
  const sessions = await getVotingSessions(20);
  const now = new Date();

  const activeVotingSessions = sessions.filter((session) => {
    if (session.status !== VOTING_STATUS.VOTING) return false;
    if (session.startAt && new Date(session.startAt) > now) return false;
    return !(session.endAt && new Date(session.endAt) <= now);
  });

  if (activeVotingSessions.length > 0) {
    const activeSessions = await Promise.all(
      activeVotingSessions.map(async (session) => {
        const nominees = await getSessionNominees(session.id);
        return {
          sessionId: session.id,
          sessionName: session.name,
          sessionDescription: session.description ?? undefined,
          sessionType: session.type,
          nominees,
        };
      })
    );
    return { activeSessions };
  }

  const finishedSessionsList = sessions
    .filter((s) => s.status === VOTING_STATUS.FINISHED && Boolean(s.showResults))
    .slice(0, 5);

  if (finishedSessionsList.length > 0) {
    const finishedSessions = await Promise.all(
      finishedSessionsList.map(async (s) => {
        const results = await getSessionResults(s.id);
        return {
          id: s.id,
          name: s.name,
          description: s.description ?? undefined,
          type: s.type,
          results: results.slice(0, 3),
        };
      })
    );

    return {
      activeSessions: [],
      finishedSessions,
    };
  }

  return { activeSessions: [] };
};
