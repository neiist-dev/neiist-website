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
  OutlookSyncJob,
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
    const { cancelExpiredReservation, getOrderByNumberNoCache } =
      await import("@/lib/db/repositories/shop.repository");
    const cancelled = await cancelExpiredReservation(job.order_number);
    if (!cancelled) return;

    const order = await getOrderByNumberNoCache(job.order_number);
    if (!order?.customer_email) return;

    const { sendEmail } = await import("@/lib/email");
    const { getAutoCancelledOrderEmailTemplate } = await import("@/lib/email/templates/shop");
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
    const { executeEventTicketHook } = await import("@/lib/shop/orders");
    await executeEventTicketHook(job);
  },

  async event_reminder(job: EventReminderJob) {
    const { getActivityByIdNoCache, getEventAttendanceRoster } =
      await import("@/lib/db/repositories/event.repository");
    const { sendEmail } = await import("@/lib/email");
    const { getEventReminderEmailTemplate } = await import("@/lib/email/templates/events");

    const event = await getActivityByIdNoCache(job.event_id);
    if (!event || !event.start) return;

    const roster = await getEventAttendanceRoster(job.event_id);
    if (!roster || roster.length === 0) return;

    const title = event.title || "Evento";

    for (const attendee of roster) {
      if (!attendee.email) continue;
      try {
        await sendEmail({
          to: attendee.email,
          subject: `Lembrete: ${title} é amanhã!`,
          html: getEventReminderEmailTemplate({
            eventTitle: title,
            eventStart: event.start,
            eventEnd: event.end || null,
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
      const {
        PUBLIC_CALENDAR_MARKER,
        getOrCreatePublicCalendar,
        listServiceAccountCalendars,
        syncAllEventsToCalendar,
      } = await import("@/lib/google/calendar");
      const { isM365Configured } = await import("@/lib/m365/graph");
      const { syncAllEventsToOutlookCalendar } = await import("@/lib/m365/calendar");
      const { getUserCalendarEmails } = await import("@/utils/calendarUtils");
      const { checkRoles, UserRole } = await import("@/types/roles");
      const { getAllUsersNoCache } = await import("@/lib/db/repositories/user.repository");
      const { getActivitiesEventsNoCache } = await import("@/lib/db/repositories/event.repository");
      const pLimit = (await import("p-limit")).default;

      if (process.env.NOTION_API_KEY && process.env.DATABASE_ID) {
        try {
          const notionEvents = await fetchAllNotionEvents();
          await syncNotionEventsToDb(notionEvents);
        } catch (notionError) {
          console.error("[redis-worker] Notion fetch failed during calendar sync:", notionError);
        }
      }

      const allUsers = await getAllUsersNoCache();
      const allDbEvents = await getActivitiesEventsNoCache(false);
      const publicDbEvents = allDbEvents.filter((event) => event.public);

      const calendarByIstid = new Map<string, string>();
      let publicCalendarId: string | undefined;
      for (const calendar of await listServiceAccountCalendars()) {
        if (!calendar.id) continue;
        if (calendar.description?.includes(PUBLIC_CALENDAR_MARKER)) {
          publicCalendarId = calendar.id;
          continue;
        }
        if (!calendar.summary?.startsWith("NEIIST-")) continue;
        const match = calendar.description?.match(/istid:([a-zA-Z0-9]+)/);
        if (match) calendarByIstid.set(match[1], calendar.id);
      }

      try {
        const resolvedPublicCalId =
          publicCalendarId ?? (await getOrCreatePublicCalendar())?.calendarId;
        if (resolvedPublicCalId) {
          await redis.expire(CALENDAR_SYNC_LOCK_KEY, CALENDAR_LOCK_TTL_SECONDS);
          await syncAllEventsToCalendar(resolvedPublicCalId, publicDbEvents);
        }
      } catch (publicCalErr) {
        console.error("[redis-worker] Error syncing public Google calendar:", publicCalErr);
      }

      const memberRoles = [UserRole._MEMBER, UserRole._COORDINATOR, UserRole._ADMIN];
      for (const user of allUsers) {
        if (!user.email || !user.istid || !checkRoles(user, memberRoles)) continue;
        const googleCalId = calendarByIstid.get(user.istid);
        if (!googleCalId) continue;

        await redis.expire(CALENDAR_SYNC_LOCK_KEY, CALENDAR_LOCK_TTL_SECONDS);
        try {
          await syncAllEventsToCalendar(googleCalId, allDbEvents, getUserCalendarEmails(user));
        } catch (calErr) {
          console.error(`[redis-worker] Error syncing calendar for ${user.istid}:`, calErr);
        }
      }

      const m365Ready = isM365Configured();
      if (m365Ready) {
        const outlookUsersToSync = allUsers.filter(
          (user) => user.email && user.istid && user.outlookCalendarSync && user.neiistEmail
        );
        const limit = pLimit(2);
        await Promise.all(
          outlookUsersToSync.map((user) =>
            limit(async () => {
              await redis.expire(CALENDAR_SYNC_LOCK_KEY, CALENDAR_LOCK_TTL_SECONDS);
              const isMember = checkRoles(user, memberRoles);
              const userEvents = isMember ? allDbEvents : publicDbEvents;
              try {
                await syncAllEventsToOutlookCalendar(
                  user.neiistEmail!,
                  userEvents,
                  getUserCalendarEmails(user)
                );
              } catch (calErr) {
                console.error(
                  `[redis-worker] Error syncing Outlook calendar for ${user.istid}:`,
                  calErr
                );
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
  outlook_sync: async (job: OutlookSyncJob) => {
    const { isM365Configured } = await import("@/lib/m365/graph");
    if (!isM365Configured()) return;

    const { getUserNoCache } = await import("@/lib/db/repositories/user.repository");
    const user = await getUserNoCache(job.istid);
    if (!user?.neiistEmail || !user.email) return;

    // Skip stale toggle jobs if user's current preference no longer matches
    if (Boolean(user.outlookCalendarSync) !== job.enabled) return;

    const { deleteOutlookSyncedEvents, syncAllEventsToOutlookCalendar } =
      await import("@/lib/m365/calendar");

    if (job.enabled) {
      const { getActivitiesEventsNoCache } = await import("@/lib/db/repositories/event.repository");
      const { getUserCalendarEmails } = await import("@/utils/calendarUtils");
      const { checkRoles, UserRole } = await import("@/types/roles");
      const isMember = checkRoles(user, [UserRole._MEMBER, UserRole._COORDINATOR, UserRole._ADMIN]);
      const allDbEvents = await getActivitiesEventsNoCache(!isMember);
      await syncAllEventsToOutlookCalendar(
        user.neiistEmail,
        allDbEvents,
        getUserCalendarEmails(user)
      );
    } else {
      await deleteOutlookSyncedEvents(user.neiistEmail);
    }
  },
};

export async function processJob(job: JobPayload): Promise<void> {
  await (jobHandlers[job.type] as JobHandler)(job);
}

function getDeadLetterKey(job: JobPayload, streamId: string): string {
  if ("order_number" in job && "event_id" in job)
    return `${job.type}:${job.order_number}:${job.event_id}`;

  if ("order_number" in job) return `${job.type}:${job.order_number}`;

  if ("event_id" in job) return `${job.type}:${job.event_id}`;

  if ("istid" in job) return `${job.type}:${job.istid}`;

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
