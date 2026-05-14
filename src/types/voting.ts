export type VotingStatus = "idle" | "voting" | "finished";

export interface DbVotingSession {
  session_id: number;
  session_name: string;
  description: string | null;
  activity_id: string;
  status: VotingStatus;
  created_at: string;
  updated_at: string;
  winner_istid: string | null;
  winner_name: string | null;
  winner_photo_path: string | null;
  vote_count: string | number | null;
  revealed_at: string | null;
}

export interface DbVotingSync {
  active_session_id: number | null;
  session_name: string | null;
  session_status: VotingStatus | null;
  activity_id: string | null;
  updated_at: string;
}

export interface DbVotingNominee {
  istid: string;
  name: string;
  photo_path: string | null;
}

export interface DbSessionResult {
  nominee_istid: string;
  nominee_name: string;
  nominee_photo_path: string | null;
  vote_count: string | number;
}

export interface DbCreatedSession {
  id: number;
  name: string;
  description: string | null;
  activity_id: string;
  status: VotingStatus;
  created_at: string;
}

export interface VotingWinner {
  istid: string;
  name: string;
  photoPath: string;
  voteCount: number;
}

export interface VotingSession {
  id: number;
  name: string;
  description?: string;
  activityId: string;
  status: VotingStatus;
  createdAt: string;
  updatedAt: string;
  winners: VotingWinner[];
  revealedAt?: string;
}

export interface VotingSync {
  activeSessionId: number | null;
  sessionName: string | null;
  sessionStatus: VotingStatus | null;
  activityId: string | null;
  updatedAt: string;
}

export interface VotingNominee {
  istid: string;
  name: string;
  photoPath: string;
}

export interface SessionResult {
  nomineeIstid: string;
  nomineeName: string;
  nomineePhotoPath: string;
  voteCount: number;
}

function photoPath(istid: string, path: string | null): string {
  return path ?? `/api/user/photo/${istid}`;
}

export function mapDbVotingNominee(row: DbVotingNominee): VotingNominee {
  return {
    istid: row.istid,
    name: row.name,
    photoPath: photoPath(row.istid, row.photo_path),
  };
}

export function mapDbSessionResult(row: DbSessionResult): SessionResult {
  return {
    nomineeIstid: row.nominee_istid,
    nomineeName: row.nominee_name,
    nomineePhotoPath: photoPath(row.nominee_istid, row.nominee_photo_path),
    voteCount: Number(row.vote_count),
  };
}

export function mapDbVotingSync(row: DbVotingSync): VotingSync {
  return {
    activeSessionId: row.active_session_id,
    sessionName: row.session_name,
    sessionStatus: row.session_status,
    activityId: row.activity_id,
    updatedAt: row.updated_at,
  };
}

export function groupDbVotingSessions(rows: DbVotingSession[]): VotingSession[] {
  const map = new Map<number, VotingSession>();

  for (const row of rows) {
    if (!map.has(row.session_id)) {
      map.set(row.session_id, {
        id: row.session_id,
        name: row.session_name,
        description: row.description ?? undefined,
        activityId: row.activity_id,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        winners: [],
        revealedAt: row.revealed_at ?? undefined,
      });
    }

    if (row.winner_istid != null && row.winner_name != null) {
      map.get(row.session_id)!.winners.push({
        istid: row.winner_istid,
        name: row.winner_name,
        photoPath: photoPath(row.winner_istid, row.winner_photo_path),
        voteCount: Number(row.vote_count),
      });
    }
  }

  return Array.from(map.values());
}
