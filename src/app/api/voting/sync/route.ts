import { NextRequest } from "next/server";
import { serverCheckRoles } from "@/utils/permissionUtils";
import { getVotingSync } from "@/utils/dbUtils";

export async function GET(request: NextRequest) {
  const auth = await serverCheckRoles([]);
  if (!auth.isAuthorized) return auth.error;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let intervalId: ReturnType<typeof setInterval> | null = null;
      let lastUpdatedAt: string | null = null;

      const sendUpdateIfChanged = async () => {
        try {
          const sync = await getVotingSync();
          const updatedAt = sync?.updatedAt ?? "none";

          if (updatedAt !== lastUpdatedAt) {
            lastUpdatedAt = updatedAt;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ updatedAt })}\n\n`));
          }
        } catch {
          controller.enqueue(encoder.encode("event: error\\ndata: sync_failed\\n\\n"));
        }
      };

      void sendUpdateIfChanged();
      intervalId = setInterval(() => {
        void sendUpdateIfChanged();
      }, 2000);

      request.signal.addEventListener("abort", () => {
        if (intervalId) clearInterval(intervalId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
