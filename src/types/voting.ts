export const VOTING_STATUS = {
  IDLE: "idle",
  VOTING: "voting",
  FINISHED: "finished",
} as const;

export type VotingStatus = (typeof VOTING_STATUS)[keyof typeof VOTING_STATUS];

export const VOTING_TYPES = {
  ACTIVITY: "activity",
  USERS: "users",
  CUSTOM: "custom",
} as const;

export type VotingType = (typeof VOTING_TYPES)[keyof typeof VOTING_TYPES];

export function isUserVotingType(type?: VotingType | string | null): boolean {
  return type === VOTING_TYPES.USERS || type === VOTING_TYPES.ACTIVITY;
}

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
  show_results?: boolean;
}

export interface DbVotingNominee {
  id: string;
  name: string;
  photo_path: string | null;
  description_photo_path?: string | null;
  description: string | null;
}

export interface DbSessionResult {
  nominee_id: string;
  nominee_name: string;
  nominee_photo_path: string | null;
  vote_count: string | number;
  description: string | null;
}

export interface CustomOptionInput {
  id?: string;
  name: string;
  description?: string;
  photoPath?: string;
  descriptionPhotoPath?: string;
}

export interface DbCustomOption {
  id: string;
  name: string;
  photo_path: string | null;
  description_photo_path: string | null;
  description: string | null;
}

export function mapCustomOptionToDb(input: CustomOptionInput): DbCustomOption {
  const mainPhoto = input.photoPath ?? null;
  return {
    id: input.id ?? "",
    name: input.name,
    photo_path: mainPhoto,
    description_photo_path: input.descriptionPhotoPath ?? mainPhoto,
    description: input.description ?? null,
  };
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
  showResults?: boolean;
  nomineeIds?: string[];
  customOptions?: CustomOptionInput[];
}

export interface VotingNominee {
  id: string;
  name: string;
  photoPath: string | null;
  descriptionPhotoPath?: string | null;
  description?: string | null;
}

export interface SessionResult {
  nomineeId: string;
  nomineeName: string;
  nomineePhotoPath: string | null;
  voteCount: number;
  description?: string | null;
}

export function mapDbVotingNominee(row: DbVotingNominee): VotingNominee {
  return {
    id: row.id,
    name: row.name,
    photoPath: row.photo_path,
    descriptionPhotoPath: row.description_photo_path ?? row.photo_path ?? null,
    description: row.description,
  };
}

export function mapDbSessionResult(row: DbSessionResult): SessionResult {
  return {
    nomineeId: row.nominee_id,
    nomineeName: row.nominee_name,
    nomineePhotoPath: row.nominee_photo_path,
    voteCount: Number(row.vote_count),
    description: row.description,
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
    showResults: row.show_results ?? false,
  };
}

export interface ActiveVotingSession {
  sessionId: number;
  sessionName: string;
  sessionDescription?: string;
  sessionType?: VotingType;
  nominees: VotingNominee[];
}

export interface FinishedVotingSession {
  id: number;
  name: string;
  description?: string;
  type?: VotingType;
  results: SessionResult[];
}

export interface GlobalVotingState {
  activeSessions: ActiveVotingSession[];
  finishedSessions?: FinishedVotingSession[];
}

export const VOTING_SYNC_EVENT_TYPES = {
  STATE_UPDATE: "STATE_UPDATE",
  VOTE_PING: "VOTE_PING",
} as const;

export const DB_VOTING_UPDATE_TYPES = {
  VOTE: "VOTE",
  STATE_CHANGE: "STATE_CHANGE",
} as const;

export type VotingSyncPayload =
  | {
      type: typeof VOTING_SYNC_EVENT_TYPES.STATE_UPDATE;
      updatedAt: string;
      state: GlobalVotingState;
    }
  | { type: typeof VOTING_SYNC_EVENT_TYPES.VOTE_PING; updatedAt: string };
