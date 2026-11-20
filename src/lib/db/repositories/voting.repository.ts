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

  const maxChoices = input.maxChoices ?? 1;

  const {
    rows: [row],
  } = await db_query<DbVotingSession>(
    `SELECT * FROM neiist.create_voting_session($1, $2, $3, $4::JSONB, $5, $6, $7, $8)`,
    [
      input.name,
      input.description ?? null,
      input.type,
      JSON.stringify(nominees),
      input.activityId ?? null,
      input.startAt ?? null,
      input.endAt ?? null,
      maxChoices,
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

export const submitVotes = async (
  sessionId: number,
  voterIstid: string,
  nomineeIds: string[]
): Promise<void> => {
  await db_query(`SELECT neiist.submit_votes($1, $2, $3::TEXT[])`, [
    sessionId,
    voterIstid,
    nomineeIds,
  ]);
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

export const getUserVotes = async (sessionId: number, voterIstid: string): Promise<string[]> => {
  const { rows } = await db_query<{ nominee_id: string }>(
    `SELECT * FROM neiist.get_user_votes($1, $2)`,
    [sessionId, voterIstid]
  );
  return rows.map((r) => r.nominee_id);
};

export interface SessionVoteLog {
  votedAt: Date;
  nomineeId: string;
  nomineeName: string;
}

export const getSessionVotesLog = async (sessionId: number): Promise<SessionVoteLog[]> => {
  const { rows } = await db_query<{
    voted_at: string;
    nominee_id: string;
    nominee_name: string;
  }>(`SELECT * FROM neiist.get_session_votes_log($1)`, [sessionId]);
  return rows.map((r) => ({
    votedAt: new Date(r.voted_at),
    nomineeId: r.nominee_id,
    nomineeName: r.nominee_name,
  }));
};

export const setSessionShowResults = async (
  sessionId: number,
  showResults: boolean
): Promise<void> => {
  await db_query(`SELECT neiist.set_session_show_results($1, $2)`, [sessionId, showResults]);
};

let statePromise: Promise<GlobalVotingState> | null = null;

const fetchGlobalVotingState = async (): Promise<GlobalVotingState> => {
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
          maxChoices: session.maxChoices ?? 1,
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
          maxChoices: s.maxChoices ?? 1,
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

export const getGlobalVotingState = (): Promise<GlobalVotingState> => {
  if (statePromise) return statePromise;

  statePromise = fetchGlobalVotingState().finally(() => {
    statePromise = null;
  });

  return statePromise;
};
