import { NextRequest } from "next/server";
import {
  validateSumUpCredentials,
  getReaderTransactionStatus,
  sumupErrorResponse,
} from "@/lib/payments/sumup";
import { paymentBroadcaster } from "@/lib/payments/broadcaster";
import { getRelayJob } from "@/lib/payments/sumupBridge";
import type { PaymentEventPayload } from "@/types/shop/payment";
import { ENABLE_SUMUP_MOBILE_BRIDGE } from "@/types/shop/sumup";
import { verifyPermission } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ readerId: string }> }) {
  const auth = await verifyPermission(["pos:access", "shop:write"], { match: "any" });
  if (auth.error) return auth.error;

  const credentialError = validateSumUpCredentials();
  if (credentialError) return credentialError;

  await params;
  const clientTransactionId = req.nextUrl.searchParams.get("client_transaction_id");
  const orderNumber =
    req.nextUrl.searchParams.get("orderNumber") || req.nextUrl.searchParams.get("order_number");

  if (!clientTransactionId) return sumupErrorResponse("client_transaction_id is required", 400);

  const encoder = new TextEncoder();
  // Reverse proxies timeout idle streams so cap single SSE connection to 90s
  // Browser EventSource automatically reconnects cleanly if reader transaction is still pending
  const maxWaitMs = 90 * 1000;
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
            // ignore
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

      // 15-second keep-alive comment for reverse proxies
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
      const unsubClientTx = paymentBroadcaster.onPaymentUpdate(
        clientTransactionId,
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
        unsubClientTx();
        unsubOrder();
      };

      sendEvent("connected", { clientTransactionId, orderNumber });

      const checkTransaction = async (): Promise<boolean> => {
        if (ENABLE_SUMUP_MOBILE_BRIDGE) {
          const job = getRelayJob(clientTransactionId);
          if (job) {
            if (
              job.userId === auth.user.istid &&
              (job.status === "paid" || job.status === "failed")
            ) {
              sendEvent(job.status, {
                status: job.status === "paid" ? "PAID" : "FAILED",
                id: job.transactionCode || clientTransactionId,
                orderNumber: job.orderNumber || orderNumber || undefined,
              });
              safeClose();
              return true;
            }
            sendEvent("pending", {
              status: "PENDING",
              elapsed: Math.round((Date.now() - startTime) / 1000),
            });
            return false;
          }
        }

        try {
          const tx = await getReaderTransactionStatus(clientTransactionId);

          const status = String(
            (tx as { status?: string; simple_status?: string }).status ||
              (tx as { simple_status?: string }).simple_status ||
              "PENDING"
          ).toUpperCase();
          const txId =
            (tx as { transaction_code?: string; id?: string }).transaction_code ||
            (tx as { id?: string }).id ||
            clientTransactionId;

          if (status === "SUCCESSFUL" || status === "PAID") {
            sendEvent("paid", {
              status: "PAID",
              id: txId,
              orderNumber: orderNumber || undefined,
              transaction: tx,
            });
            safeClose();
            return true;
          }

          if (status === "FAILED" || status === "CANCELLED") {
            sendEvent("failed", {
              status: "FAILED",
              id: txId,
            });
            safeClose();
            return true;
          }

          sendEvent("pending", {
            status: "PENDING",
            elapsed: Math.round((Date.now() - startTime) / 1000),
          });
        } catch {
          // Transaction not yet available on SumUp servers
          sendEvent("pending", {
            status: "PENDING",
            elapsed: Math.round((Date.now() - startTime) / 1000),
          });
        }
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

      while (!isClosed && Date.now() - startTime < maxWaitMs) {
        const terminal = await checkTransaction();
        if (terminal) return;

        // Fallback periodic check every 5s or instant push wakeup
        await waitForNext(5000);
      }

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
