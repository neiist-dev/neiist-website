import { NextRequest, NextResponse } from "next/server";
import { dbBroadcaster } from "@/lib/dbBroadcaster";
import { VotingSyncPayload, VOTING_SYNC_EVENT_TYPES, DB_VOTING_UPDATE_TYPES } from "@/types/voting";
import { getGlobalVotingState } from "@/lib/db/repositories/voting.repository";
import { getAuthenticatedUser } from "@/lib/auth";

let eventIdCounter = 0;

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedUser();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  void dbBroadcaster.connect();

  const encoder = new TextEncoder();
  let cleanupRef: (() => void) | null = null;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let isCleanedUp = false;
      let heartbeatId: ReturnType<typeof setInterval> | null = null;

      const cleanup = () => {
        if (isCleanedUp) return;
        isCleanedUp = true;

        if (heartbeatId) {
          clearInterval(heartbeatId);
          heartbeatId = null;
        }

        dbBroadcaster.off("voting_update", onUpdate);
        request.signal.removeEventListener("abort", cleanup);

        try {
          controller.close();
        } catch {
          // Controller might already be closed or errored
        }
      };

      cleanupRef = cleanup;

      if (request.signal.aborted) {
        cleanup();
        return;
      }

      request.signal.addEventListener("abort", cleanup);

      const safeEnqueue = (chunk: string): boolean => {
        if (isCleanedUp || request.signal.aborted) return false;
        try {
          controller.enqueue(encoder.encode(chunk));
          return true;
        } catch {
          cleanup();
          return false;
        }
      };

      const pushStateUpdate = async (updatedAt: string) => {
        if (isCleanedUp || request.signal.aborted) return;
        try {
          const state = await getGlobalVotingState();
          if (isCleanedUp || request.signal.aborted) return;
          eventIdCounter++;
          const payload: VotingSyncPayload = {
            type: VOTING_SYNC_EVENT_TYPES.STATE_UPDATE,
            updatedAt,
            state,
          };
          const data = JSON.stringify(payload);
          safeEnqueue(`id: ${eventIdCounter}\ndata: ${data}\n\n`);
        } catch (error) {
          console.error("SSE Broadcast Error:", error);
          if (request.signal.aborted) cleanup();
        }
      };

      const pushVotePing = (updatedAt: string) => {
        if (isCleanedUp || request.signal.aborted) return;
        eventIdCounter++;
        const payload: VotingSyncPayload = {
          type: VOTING_SYNC_EVENT_TYPES.VOTE_PING,
          updatedAt,
        };
        const data = JSON.stringify(payload);
        safeEnqueue(`id: ${eventIdCounter}\ndata: ${data}\n\n`);
      };

      const onUpdate = (payload: { type?: string; updated_at: string }) => {
        if (isCleanedUp || request.signal.aborted) {
          cleanup();
          return;
        }
        if (payload.type === DB_VOTING_UPDATE_TYPES.VOTE) {
          pushVotePing(payload.updated_at);
        } else {
          void pushStateUpdate(payload.updated_at);
        }
      };

      // Subscribe to DB broadcaster
      dbBroadcaster.on("voting_update", onUpdate);

      // Heartbeat keep alive through proxies
      heartbeatId = setInterval(() => {
        safeEnqueue(": heartbeat\n\n");
      }, 15000);

      // Advise browser EventSource reconnection delay (3s) and push initial state
      safeEnqueue("retry: 3000\n\n");
      await pushStateUpdate(new Date().toISOString());
    },
    cancel() {
      if (cleanupRef) cleanupRef();
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
