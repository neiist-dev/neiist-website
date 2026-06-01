import { NextRequest } from "next/server";
import { serverCheckRoles } from "@/utils/permissionUtils";
import { dbBroadcaster } from "@/lib/dbBroadcaster";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await serverCheckRoles([]);
  if (!auth.isAuthorized) return auth.error;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let heartbeatId: ReturnType<typeof setInterval> | null = null;

      const onUpdate = (payload: { updated_at: string }) => {
        try {
          const data = JSON.stringify({ updatedAt: payload.updated_at });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch (error) {
          console.error("SSE Broadcast Error:", error);
        }
      };

      // Send initial state to synchronize client
      const initialData = JSON.stringify({ updatedAt: new Date().toISOString() });
      controller.enqueue(encoder.encode(`data: ${initialData}\n\n`));

      // Subscribe
      dbBroadcaster.on("voting_update", onUpdate);

      // Heartbeat keep alive trough proxies
      heartbeatId = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {}
      }, 15000);

      request.signal.addEventListener("abort", () => {
        if (heartbeatId) clearInterval(heartbeatId);
        dbBroadcaster.off("voting_update", onUpdate);
        try {
          controller.close();
        } catch {}
      });
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
