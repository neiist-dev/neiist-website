import { NextRequest } from "next/server";
import { dbBroadcaster } from "@/lib/dbBroadcaster";
import { GlobalVotingState, VotingSyncPayload } from "@/types/voting";
import { getVotingSessions, getSessionNominees, getSessionResults } from "@/utils/db/votingQueries";
import { serverCheckRoles } from "@/lib/auth";

export const dynamic = "force-dynamic";

let statePromise: Promise<GlobalVotingState> | null = null;
let eventIdCounter = 0;

async function fetchGlobalVotingState(): Promise<GlobalVotingState> {
  const sessions = await getVotingSessions(20);
  const now = new Date();

  const activeVotingSessions = sessions.filter((session) => {
    if (session.status !== "voting") return false;
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
          sessionDescription: session.description,
          nominees,
        };
      })
    );
    return { activeSessions };
  }

  const lastFinishedSession = sessions.find((s) => s.status === "finished");
  if (lastFinishedSession) {
    const lastResults = await getSessionResults(lastFinishedSession.id);
    return {
      activeSessions: [],
      lastFinishedSession: {
        id: lastFinishedSession.id,
        name: lastFinishedSession.name,
        description: lastFinishedSession.description,
      },
      lastResults: lastResults.slice(0, 4),
    };
  }

  return { activeSessions: [] };
}

function getGlobalVotingState(): Promise<GlobalVotingState> {
  if (statePromise) return statePromise;

  statePromise = fetchGlobalVotingState().finally(() => {
    statePromise = null;
  });

  return statePromise;
}

export async function GET(request: NextRequest) {
  const auth = await serverCheckRoles([]);
  if (!auth.isAuthorized) return auth.error;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let heartbeatId: ReturnType<typeof setInterval> | null = null;

      const pushStateUpdate = async (updatedAt: string) => {
        try {
          const state = await getGlobalVotingState();
          eventIdCounter++;
          const payload: VotingSyncPayload = { type: "STATE_UPDATE", updatedAt, state };
          const data = JSON.stringify(payload);
          controller.enqueue(encoder.encode(`id: ${eventIdCounter}\ndata: ${data}\n\n`));
        } catch (error) {
          console.error("SSE Broadcast Error:", error);
        }
      };

      const pushVotePing = (updatedAt: string) => {
        eventIdCounter++;
        const payload: VotingSyncPayload = { type: "VOTE_PING", updatedAt };
        const data = JSON.stringify(payload);
        controller.enqueue(encoder.encode(`id: ${eventIdCounter}\ndata: ${data}\n\n`));
      };

      const onUpdate = (payload: { type?: string; updated_at: string }) => {
        if (payload.type === "VOTE") {
          pushVotePing(payload.updated_at);
        } else {
          pushStateUpdate(payload.updated_at);
        }
      };

      // Send initial state to synchronize client
      await pushStateUpdate(new Date().toISOString());

      // Subscribe
      dbBroadcaster.on("voting_update", onUpdate);

      // Heartbeat keep alive trough proxies
      heartbeatId = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          // Ignore
        }
      }, 15000);

      request.signal.addEventListener("abort", () => {
        dbBroadcaster.off("voting_update", onUpdate);
        if (heartbeatId) clearInterval(heartbeatId);
        try {
          controller.close();
        } catch {
          // Ignore
        }
      });
    },
    cancel() {
      try {
        dbBroadcaster.setMaxListeners(Math.max(0, dbBroadcaster.getMaxListeners() - 1));
      } catch {
        // Ignore
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
