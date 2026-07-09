export type VotingStatus = "idle" | "voting" | "finished";
export type VotingType = "activity" | "users" | "custom";

export interface DbVotingSession {
  id: number;
  name: string;
  description: string | null;
  type: VotingType;
  activity_id: string | null;
  status: VotingStatus;
  start_at: string | null;
  end_at: string | null;
  total_votes: string | number;
  created_at: string;
  updated_at: string;
}

export interface DbVotingNominee {
  id: string;
  name: string;
  photo_path: string | null;
}

export interface DbSessionResult {
  nominee_id: string;
  nominee_name: string;
  nominee_photo_path: string | null;
  vote_count: string | number;
}

export interface VotingSession {
  id: number;
  name: string;
  description?: string;
  type: VotingType;
  activityId?: string;
  status: VotingStatus;
  startAt?: Date | string;
  endAt?: Date | string;
  totalVotes: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  nomineeIds?: string[];
}

export interface VotingNominee {
  id: string;
  name: string;
  photoPath: string | null;
}

export interface SessionResult {
  nomineeId: string;
  nomineeName: string;
  nomineePhotoPath: string | null;
  voteCount: number;
}

export function mapDbVotingNominee(row: DbVotingNominee): VotingNominee {
  return {
    id: row.id,
    name: row.name,
    photoPath: row.photo_path,
  };
}

export function mapDbSessionResult(row: DbSessionResult): SessionResult {
  return {
    nomineeId: row.nominee_id,
    nomineeName: row.nominee_name,
    nomineePhotoPath: row.nominee_photo_path,
    voteCount: Number(row.vote_count),
  };
}

export function mapDbVotingSession(row: DbVotingSession): VotingSession {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    type: row.type,
    activityId: row.activity_id ?? undefined,
    status: row.status,
    startAt: row.start_at ? new Date(row.start_at) : undefined,
    endAt: row.end_at ? new Date(row.end_at) : undefined,
    totalVotes: Number(row.total_votes),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export interface GlobalVotingState {
  activeSessions: {
    sessionId: number;
    sessionName: string;
    sessionDescription?: string;
    nominees: VotingNominee[];
  }[];
  lastFinishedSession?: {
    id: number;
    name: string;
    description?: string;
  };
  lastResults?: SessionResult[];
}

export type VotingSyncPayload =
  | { type: "STATE_UPDATE"; updatedAt: string; state: GlobalVotingState }
  | { type: "VOTE_PING"; updatedAt: string };
