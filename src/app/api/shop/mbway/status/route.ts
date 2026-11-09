import { NextRequest } from "next/server";
import { checkMbWayStatus, handleMbWayStatusUpdate } from "@/lib/payments/ifthenpay";
import { paymentBroadcaster, type PaymentEventPayload } from "@/lib/payments/broadcaster";
import { getRedisClient } from "@/lib/redis/client";
import { MBWAY_STATUS } from "@/types/shop/ifthenpay";

const TERMINAL_CACHED_STATUSES = new Set(["paid", "declined", "expired", "failed"]);
const TERMINAL_STATUS_CODES = new Set<string>([
  MBWAY_STATUS.PAID,
  MBWAY_STATUS.DECLINED,
  MBWAY_STATUS.EXPIRED,
  MBWAY_STATUS.FAILED,
  MBWAY_STATUS.INIT_ERROR,
]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get("requestId");
  const orderNumber = searchParams.get("orderNumber");

  if (!requestId) {
    return new Response(JSON.stringify({ error: "Missing requestId parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  // Reverse proxies timeout idle streams; cap single SSE connection to 90s.
  // Browser EventSource automatically reconnects on clean closure if still pending.
  const maxDurationMs = 90 * 1000;
  const startTime = Date.now();
  let cleanupRef: (() => void) | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;
      let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
      let wakeUpResolver: (() => void) | null = null;

      const safeClose = () => {
        if (!isClosed) {
          isClosed = true;
          if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
          }
          if (wakeUpResolver) {
            wakeUpResolver();
            wakeUpResolver = null;
          }
          unsubBroadcaster();
          try {
            controller.close();
          } catch {
            // Already closed or aborted
          }
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

      req.signal.addEventListener("abort", () => {
        safeClose();
      });

      // 15-second keep-alive comment so reverse proxies do not drop connection
      heartbeatTimer = setInterval(() => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        } catch {
          safeClose();
        }
      }, 15000);

      const triggerWakeup = () => {
        if (wakeUpResolver) {
          wakeUpResolver();
          wakeUpResolver = null;
        }
      };

      // Subscribe to payment broadcaster for instant push wakeup
      const unsubReq = paymentBroadcaster.onPaymentUpdate(
        requestId,
        (_payload: PaymentEventPayload) => {
          triggerWakeup();
        }
      );
      const unsubOrder = orderNumber
        ? paymentBroadcaster.onPaymentUpdate(orderNumber, (_payload: PaymentEventPayload) => {
            triggerWakeup();
          })
        : () => {};

      const unsubBroadcaster = () => {
        unsubReq();
        unsubOrder();
      };

      // Send initial connect tick
      sendEvent("connected", { requestId, orderNumber });

      const checkPayment = async (): Promise<boolean> => {
        // Read shiftId, orderNumbers, and cached status from Redis if present
        let shiftId: string | null = null;
        let cachedOrderNumber: string | null = null;
        let cachedOrderNumbers: string[] | null = null;
        try {
          const cached = await getRedisClient().get(`mbway:req:${requestId}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            shiftId = parsed.shiftId || null;
            cachedOrderNumber = parsed.orderNumber || null;
            cachedOrderNumbers = Array.isArray(parsed.orderNumbers) ? parsed.orderNumbers : null;
            if (typeof parsed.status === "string" && TERMINAL_CACHED_STATUSES.has(parsed.status)) {
              sendEvent(parsed.status, {
                type: "status",
                status: parsed.status.toUpperCase(),
                orderNumber: cachedOrderNumber || orderNumber,
                requestId,
                message: parsed.message || "",
              });
              safeClose();
              return true;
            }
          }
        } catch {
          // ignore cache parse error
        }

        const statusRes = await checkMbWayStatus(requestId);
        const statusCode = String(statusRes?.Status || "").trim();

        if (TERMINAL_STATUS_CODES.has(statusCode)) {
          const result = await handleMbWayStatusUpdate({
            requestId,
            statusCode,
            orderNumber: cachedOrderNumber || orderNumber,
            orderNumbers: cachedOrderNumbers,
            shiftId,
            message: statusRes.Message,
            callerLabel: "ifthenpay-mbway",
          });
          sendEvent(result.status, {
            type: "status",
            status: result.status.toUpperCase(),
            orderNumber: cachedOrderNumber || orderNumber,
            requestId,
            message: result.message,
          });
          safeClose();
          return true;
        }

        // In-progress / Pending acceptance
        sendEvent("pending", {
          status: "PENDING",
          message: statusRes.Message || "A aguardar confirmação...",
          elapsed: Math.round((Date.now() - startTime) / 1000),
        });

        return false;
      };

      const waitForNext = (ms: number): Promise<void> => {
        return new Promise((resolve) => {
          let timer: ReturnType<typeof setTimeout> | null = null;
          const done = () => {
            if (timer) clearTimeout(timer);
            wakeUpResolver = null;
            resolve();
          };
          wakeUpResolver = done;
          timer = setTimeout(done, ms);
        });
      };

      while (!isClosed && Date.now() - startTime < maxDurationMs) {
        try {
          const terminal = await checkPayment();
          if (terminal) return;
        } catch {
          sendEvent("pending", {
            status: "PENDING",
            warning: "A verificar estado...",
          });
        }

        // Wait up to 5s for fallback check, or wake up instantly on push event
        await waitForNext(5000);
      }

      // Stream duration capped at 90s: cleanly close so browser EventSource seamlessly reconnects
      safeClose();
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
