import { NextRequest } from "next/server";
import { dbBroadcaster } from "@/lib/dbBroadcaster";
import { VotingSyncPayload, VOTING_SYNC_EVENT_TYPES, DB_VOTING_UPDATE_TYPES } from "@/types/voting";
import { getGlobalVotingState } from "@/lib/db/repositories/voting.repository";
import { verifyPermission } from "@/lib/auth";

let eventIdCounter = 0;

export async function GET(request: NextRequest) {
  const auth = await verifyPermission("voting:read");
  if (auth.error) return auth.error;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let heartbeatId: ReturnType<typeof setInterval> | null = null;

      const pushStateUpdate = async (updatedAt: string) => {
        try {
          const state = await getGlobalVotingState();
          eventIdCounter++;
          const payload: VotingSyncPayload = {
            type: VOTING_SYNC_EVENT_TYPES.STATE_UPDATE,
            updatedAt,
            state,
          };
          const data = JSON.stringify(payload);
          controller.enqueue(encoder.encode(`id: ${eventIdCounter}\ndata: ${data}\n\n`));
        } catch (error) {
          console.error("SSE Broadcast Error:", error);
        }
      };

      const pushVotePing = (updatedAt: string) => {
        eventIdCounter++;
        const payload: VotingSyncPayload = {
          type: VOTING_SYNC_EVENT_TYPES.VOTE_PING,
          updatedAt,
        };
        const data = JSON.stringify(payload);
        controller.enqueue(encoder.encode(`id: ${eventIdCounter}\ndata: ${data}\n\n`));
      };

      const onUpdate = (payload: { type?: string; updated_at: string }) => {
        if (payload.type === DB_VOTING_UPDATE_TYPES.VOTE) {
          pushVotePing(payload.updated_at);
        } else {
          pushStateUpdate(payload.updated_at);
        }
      };

      // Send initial state to synchronize client
      await pushStateUpdate(new Date().toISOString());

      // Subscribe
      dbBroadcaster.on("voting_update", onUpdate);

      // Heartbeat keep alive through proxies
      heartbeatId = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          // Ignore
        }
      }, 15000);

      const cleanup = () => {
        dbBroadcaster.off("voting_update", onUpdate);
        if (heartbeatId) clearInterval(heartbeatId);
      };

      request.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      // Handled via abort signal or stream cancellation
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
