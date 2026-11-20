import { NextRequest, NextResponse } from "next/server";
import { verifyPermission } from "@/lib/auth";
import { registerRelayConnection } from "@/lib/payments/sumupBridge";
import { ENABLE_SUMUP_MOBILE_BRIDGE } from "@/types/shop/sumup";

export async function GET(req: NextRequest) {
  if (!ENABLE_SUMUP_MOBILE_BRIDGE)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const auth = await verifyPermission("pos:access");
  if (auth.error) return auth.error;

  const userId = auth.user.istid;
  const sessionId = req.nextUrl.searchParams.get("sessionId")?.trim() || crypto.randomUUID();
  const encoder = new TextEncoder();
  let cleanupRef: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      let isClosed = false;
      let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
      let unsubRelay: (() => void) | null = null;

      const safeClose = () => {
        if (isClosed) return;
        isClosed = true;
        req.signal.removeEventListener("abort", safeClose);
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }
        if (unsubRelay) {
          unsubRelay();
          unsubRelay = null;
        }
        try {
          controller.close();
        } catch {
          // ignore
        }
      };

      cleanupRef = safeClose;

      const sendEvent = (event: string, data: unknown) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          safeClose();
        }
      };

      req.signal.addEventListener("abort", safeClose);

      heartbeatTimer = setInterval(() => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        } catch {
          safeClose();
        }
      }, 15000);

      unsubRelay = registerRelayConnection(sessionId, userId, sendEvent, safeClose);
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
