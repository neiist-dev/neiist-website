import { getRedisClient } from "@/lib/redis/client";
import { PUMP_DELAYED_JOBS_LUA } from "@/lib/redis/scripts";
import {
  EventReminderJob,
  CalendarSyncJob,
  JobPayload,
  DELAYED_JOBS_KEY,
  STREAM_KEY,
  DEAD_LETTER_KEY,
  CALENDAR_SYNC_PENDING_KEY,
} from "@/types/redis";

const reminderMember = (eventId: string): string =>
  JSON.stringify({ type: "event_reminder", event_id: eventId } satisfies EventReminderJob);

/**
 * Schedules a delayed job in the Redis ZSET.
 * The job member is deterministic so repeated calls with the same attempt are idempotent.
 */
export async function scheduleDelayedJob(job: JobPayload, dueAtMs: number): Promise<void> {
  const redis = getRedisClient();
  const serialized = JSON.stringify(job);
  await redis.zadd(DELAYED_JOBS_KEY, dueAtMs, serialized);
}

/**
 * Directly pushes a job to the Redis Stream for immediate asynchronous processing.
 */
export async function enqueueStreamJob(job: JobPayload): Promise<string> {
  const redis = getRedisClient();
  const serialized = JSON.stringify(job);
  const id = await redis.xadd(STREAM_KEY, "MAXLEN", "~", 10000, "*", "payload", serialized);
  return id as string;
}

/**
 * Atomically transfers due jobs from jobs:delayed ZSET to jobs:stream Stream via Lua script.
 */
export async function pumpDueJobs(limit = 50): Promise<number> {
  const redis = getRedisClient();
  const now = Date.now().toString();
  const count = await redis.eval(
    PUMP_DELAYED_JOBS_LUA,
    2,
    DELAYED_JOBS_KEY,
    STREAM_KEY,
    now,
    limit
  );
  return Number(count) || 0;
}

/**
 * Moves an exhausted job after retries to the Dead-Letter Queue.
 */
export async function moveToDeadLetter(
  jobKey: string,
  job: JobPayload,
  error: string
): Promise<void> {
  const redis = getRedisClient();
  await redis.hset(
    DEAD_LETTER_KEY,
    jobKey,
    JSON.stringify({
      key: jobKey,
      job,
      error,
      failed_at: new Date().toISOString(),
    })
  );
}

/**
 * Triggers a debounced calendar sync via Redis.
 * Sets events:sync:pending = 1 and schedules a delayed job in jobs:delayed (5s debounce).
 */
export async function triggerDebouncedCalendarSync(
  source: "notion_webhook" | "manual" | "website_mutation" = "website_mutation",
  debounceMs = 5000
): Promise<void> {
  const redis = getRedisClient();
  await redis.set(CALENDAR_SYNC_PENDING_KEY, "1");
  const job: CalendarSyncJob = { type: "calendar_sync", source };
  await scheduleDelayedJob(job, Date.now() + debounceMs);
}

/**
 * Schedules an event reminder email 24h before the event start.
 * If the reminder time is already in the past (e.g. event moved sooner), cancels any existing reminder.
 */
export async function scheduleEventReminder(event: {
  id: string;
  start: { dateTime?: string; date?: string };
}): Promise<void> {
  const startStr = event.start.dateTime || event.start.date;
  if (!startStr) return;

  const startTime = new Date(startStr).getTime();
  const reminderTime = startTime - 24 * 60 * 60 * 1000;

  if (reminderTime <= Date.now()) {
    await cancelEventReminder(event.id);
    return;
  }

  const job: EventReminderJob = { type: "event_reminder", event_id: event.id };
  await scheduleDelayedJob(job, reminderTime);
}

/**
 * Cancels a scheduled event reminder in O(log N) via deterministic ZSET member removal.
 */
export async function cancelEventReminder(eventId: string): Promise<void> {
  await getRedisClient().zrem(DELAYED_JOBS_KEY, reminderMember(eventId));
}
