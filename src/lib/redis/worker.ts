import { createDedicatedRedisClient, getRedisClient } from "@/lib/redis/client";
import { RELEASE_LOCK_LUA } from "@/lib/redis/scripts";
import {
  pumpDueJobs,
  scheduleDelayedJob,
  moveToDeadLetter,
  triggerDebouncedCalendarSync,
} from "@/lib/redis/queue";
import {
  STREAM_KEY,
  STREAM_GROUP,
  CALENDAR_SYNC_LOCK_KEY,
  CALENDAR_SYNC_PENDING_KEY,
  JobType,
  JobPayload,
  ExpireJob,
  EventHookJob,
  EventReminderJob,
  CalendarSyncJob,
} from "@/types/redis";

declare global {
  var __neiistShopWorkerRunning: boolean | undefined;
}

const BACKOFF_MS = [10000, 30000, 60000];
const CALENDAR_LOCK_TTL_SECONDS = 300;

export async function initConsumerGroup(): Promise<void> {
  const redis = getRedisClient();
  try {
    await redis.xgroup("CREATE", STREAM_KEY, STREAM_GROUP, "0", "MKSTREAM");
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (!msg.includes("BUSYGROUP"))
      console.error("[redis-worker] failed to create consumer group:", error);
  }
}

type JobHandler<J extends JobPayload = JobPayload> = (_job: J) => Promise<void>;

const jobHandlers: { [K in JobType]: JobHandler<Extract<JobPayload, { type: K }>> } = {
  async expire(job: ExpireJob) {
    const { cancelExpiredReservation, getOrderByNumber } =
      await import("@/lib/db/repositories/shop.repository");
    const cancelled = await cancelExpiredReservation(job.order_number);
    if (!cancelled) return;

    const order = await getOrderByNumber(job.order_number);
    if (!order?.customer_email) return;

    const { sendEmail, getAutoCancelledOrderEmailTemplate } = await import("@/lib/email");
    try {
      await sendEmail({
        to: order.customer_email,
        subject: `Encomenda ${order.order_number} - Cancelada por expiração`,
        html: getAutoCancelledOrderEmailTemplate(
          order.order_number,
          order.customer_name ?? "Cliente",
          order.campus ?? undefined
        ),
      });
    } catch (emailErr) {
      console.warn("[redis-worker] failed to send auto-cancelled email:", emailErr);
    }
  },

  async event_hook(job: EventHookJob) {
    const { executeEventTicketHook } = await import("@/utils/shop/orderFinalization");
    await executeEventTicketHook(job);
  },

  async event_reminder(job: EventReminderJob) {
    const { getActivityByIdFromDb, getEventAttendanceRoster } =
      await import("@/lib/db/repositories/event.repository");
    const { sendEmail, getEventReminderEmailTemplate } = await import("@/lib/email");

    const event = await getActivityByIdFromDb(job.event_id);
    if (!event) return;

    const startStr = event.start.dateTime || event.start.date;
    if (!startStr) return;

    const roster = await getEventAttendanceRoster(job.event_id);
    if (!roster || roster.length === 0) return;

    for (const attendee of roster) {
      if (!attendee.email) continue;
      try {
        await sendEmail({
          to: attendee.email,
          subject: `Lembrete: ${event.summary} é amanhã!`,
          html: getEventReminderEmailTemplate({
            eventTitle: event.summary,
            eventStart: startStr,
            eventEnd: event.end.dateTime || event.end.date || null,
            location: event.location,
            attendeeName: attendee.name,
            ticketCode: attendee.ticket_code || "CONFIRMED",
          }),
        });
      } catch (emailErr) {
        console.warn(
          `[redis-worker] failed to send reminder email to ${attendee.email}:`,
          emailErr
        );
      }
    }
  },

  async calendar_sync(_job: CalendarSyncJob) {
    const redis = getRedisClient();
    const workerLockId = `sync-${process.pid}-${Date.now()}`;
    const acquired = await redis.set(
      CALENDAR_SYNC_LOCK_KEY,
      workerLockId,
      "EX",
      CALENDAR_LOCK_TTL_SECONDS,
      "NX"
    );
    if (!acquired) {
      console.warn("[redis-worker] calendar sync already in progress by another worker");
      return;
    }

    try {
      await redis.del(CALENDAR_SYNC_PENDING_KEY);
      const { fetchAllNotionEvents, syncNotionEventsToDb } = await import("@/utils/eventsUtils");
      const { getCalendarClient, syncAllEventsToCalendar } = await import("@/lib/google/calendar");
      const { getAllUsersNoCache } = await import("@/lib/db/repositories/user.repository");
      const { getActivitiesEventsFromDbRaw } =
        await import("@/lib/db/repositories/event.repository");
      const pLimit = (await import("p-limit")).default;

      if (process.env.NOTION_API_KEY && process.env.DATABASE_ID) {
        try {
          const notionEvents = await fetchAllNotionEvents();
          await syncNotionEventsToDb(notionEvents);
        } catch (notionError) {
          console.error("[redis-worker] Notion fetch failed during calendar sync:", notionError);
        }
      }

      const calendarClient = getCalendarClient();
      if (calendarClient) {
        const calList = await calendarClient.calendarList.list();
        const calendars = (calList.data.items || []).filter((calendar) =>
          calendar.summary?.startsWith("NEIIST-")
        );
        const calendarByIstid = new Map<string, { id: string; summary: string }>();
        calendars.forEach((calendar) => {
          const match = calendar.description?.match(/istid:([a-zA-Z0-9]+)/);
          if (match)
            calendarByIstid.set(match[1], { id: calendar.id!, summary: calendar.summary! });
        });

        const allUsers = await getAllUsersNoCache();
        const usersWithCalendars = allUsers.filter(
          (user) => user.email && user.istid && calendarByIstid.has(user.istid)
        );

        const allDbEvents = await getActivitiesEventsFromDbRaw(false);
        const notionFormatEvents = allDbEvents.map((event) => ({
          id: event.id,
          title: event.summary,
          date: event.start.date || event.start.dateTime || null,
          end: event.end.date || event.end.dateTime || null,
          url: event.source?.url || "",
          location: event.location ? [event.location] : [],
          type: event.extendedProperties?.private?.type || null,
          teams: event.extendedProperties?.private?.teams?.split(",").filter(Boolean) || [],
          attendees: event.extendedProperties?.private?.attendees?.split(",").filter(Boolean) || [],
          lastEditedTime:
            event.extendedProperties?.private?.lastEditedTime || new Date().toISOString(),
          public: event.extendedProperties?.private?.public !== false,
        }));

        const limit = pLimit(2);
        await Promise.all(
          usersWithCalendars.map((user) =>
            limit(async () => {
              try {
                await redis.expire(CALENDAR_SYNC_LOCK_KEY, CALENDAR_LOCK_TTL_SECONDS);
                const altEmail = user.alternativeEmailVerified
                  ? (user.alternativeEmail ?? undefined)
                  : undefined;
                const calId = calendarByIstid.get(user.istid)!.id;
                await syncAllEventsToCalendar(calId, notionFormatEvents, user.email!, altEmail);
              } catch (calErr) {
                console.error(`[redis-worker] Error syncing calendar for ${user.istid}:`, calErr);
              }
            })
          )
        );
      }
      console.warn("[redis-worker] Calendar sync successfully completed");
    } catch (syncError) {
      console.error("[redis-worker] Calendar sync failed:", syncError);
    } finally {
      await redis.eval(RELEASE_LOCK_LUA, 1, CALENDAR_SYNC_LOCK_KEY, workerLockId).catch(() => {});
      const pendingAgain = await redis.get(CALENDAR_SYNC_PENDING_KEY);
      if (pendingAgain) {
        await triggerDebouncedCalendarSync("website_mutation", 3000);
      }
    }
  },
};

export async function processJob(job: JobPayload): Promise<void> {
  await (jobHandlers[job.type] as JobHandler)(job);
}

function getDeadLetterKey(job: JobPayload, streamId: string): string {
  if ("order_number" in job && "event_id" in job) {
    return `${job.type}:${job.order_number}:${job.event_id}`;
  }
  if ("order_number" in job) {
    return `${job.type}:${job.order_number}`;
  }
  if ("event_id" in job) {
    return `${job.type}:${job.event_id}`;
  }
  return `${job.type}:${streamId}`;
}

/**
 * Starts the Redis Stream worker consumer loop and delayed job pump.
 */
export function startShopWorker(): void {
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (globalThis.__neiistShopWorkerRunning) return;
  globalThis.__neiistShopWorkerRunning = true;

  const consumerId = `worker-${process.pid}-${Math.random().toString(36).substring(2, 7)}`;
  const dedicatedClient = createDedicatedRedisClient();

  let pumping = false;
  const pumpTimer = setInterval(() => {
    if (pumping) return;
    pumping = true;
    void pumpDueJobs()
      .catch((error) => console.error("[redis-worker] pump error:", error))
      .finally(() => {
        pumping = false;
      });
  }, 5000);
  pumpTimer.unref();

  const handleShutdown = () => {
    globalThis.__neiistShopWorkerRunning = false;
    clearInterval(pumpTimer);
    try {
      dedicatedClient.disconnect();
    } catch {
      // ignore
    }
  };

  const handleEntries = async (messages: Array<[string, string[]]>): Promise<void> => {
    for (const [id, fields] of messages) {
      let job: JobPayload | null = null;
      for (let i = 0; i < fields.length; i += 2) {
        if (fields[i] === "payload") {
          try {
            job = JSON.parse(fields[i + 1]) as JobPayload;
          } catch {
            job = null;
          }
        }
      }

      if (!job) {
        await dedicatedClient.xack(STREAM_KEY, STREAM_GROUP, id);
        continue;
      }

      try {
        await processJob(job);
        await dedicatedClient.xack(STREAM_KEY, STREAM_GROUP, id);
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const dlqKey = getDeadLetterKey(job, id);
        console.error(`[redis-worker] error processing job ${dlqKey}:`, error);

        const currentAttempt = job.attempt || 1;
        if (currentAttempt <= BACKOFF_MS.length) {
          const backoff = BACKOFF_MS[currentAttempt - 1];
          await scheduleDelayedJob({ ...job, attempt: currentAttempt + 1 }, Date.now() + backoff);
        } else {
          await moveToDeadLetter(dlqKey, job, errorMsg);
        }

        await dedicatedClient.xack(STREAM_KEY, STREAM_GROUP, id);
      }
    }
  };

  void (async () => {
    await initConsumerGroup();
    await pumpDueJobs().catch(() => {});
    console.warn(`[redis-worker] started consumer ${consumerId} on group ${STREAM_GROUP}`);

    let lastClaim = 0;

    while (globalThis.__neiistShopWorkerRunning) {
      try {
        const now = Date.now();
        if (now - lastClaim > 30000) {
          lastClaim = now;
          try {
            const claimed = (await dedicatedClient.xautoclaim(
              STREAM_KEY,
              STREAM_GROUP,
              consumerId,
              600000,
              "0-0",
              "COUNT",
              50
            )) as [string, Array<[string, string[]]>] | null;

            if (claimed && Array.isArray(claimed[1]) && claimed[1].length > 0)
              await handleEntries(claimed[1]);
          } catch {
            // Group might be initializing
          }
        }

        const response = (await dedicatedClient.xreadgroup(
          "GROUP",
          STREAM_GROUP,
          consumerId,
          "COUNT",
          5,
          "BLOCK",
          2000,
          "STREAMS",
          STREAM_KEY,
          ">"
        )) as Array<[string, Array<[string, string[]]>]> | null;

        if (response && response.length > 0) {
          for (const [, messages] of response) await handleEntries(messages);
        }
      } catch (loopErr) {
        if (!globalThis.__neiistShopWorkerRunning) break;
        console.error("[redis-worker] loop error:", loopErr);
        await new Promise((res) => setTimeout(res, 2000));
      }
    }

    handleShutdown();
  })();
}
