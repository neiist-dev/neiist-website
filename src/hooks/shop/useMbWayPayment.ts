import { useState, useRef, useEffect, useCallback } from "react";
import { formatTimer } from "@/utils/shop/shopUtils";
import type { Dictionary } from "@/i18n/dictionaries";
import type { StockRequestItem } from "@/types/redis";
import type { OrderSource } from "@/types/shop/order";

export function useMbWayPayment(options: {
  messages: Dictionary["payments"]["mbway"];
  onPaid?: (_data: { requestId: string; orderNumber: string }) => void | Promise<void>;
  onDeclined?: (_message?: string) => void;
  onExpired?: (_message?: string) => void;
  onFailed?: (_message?: string) => void;
  onError?: (_error: string) => void;
}) {
  const [state, setState] = useState<"idle" | "waiting" | "success" | "error">("idle");
  const [statusText, setStatusText] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(240);
  const [requestId, setRequestId] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const closeSse = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    closeSse();
    setState("idle");
    setStatusText("");
  }, [closeSse]);

  const reset = useCallback(() => {
    closeSse();
    setState("idle");
    setStatusText("");
    setTimeLeft(240);
    setRequestId(null);
  }, [closeSse]);

  // Countdown timer when waiting
  useEffect(() => {
    if (state !== "waiting") {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [state]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      closeSse();
    };
  }, [closeSse]);

  const startPayment = useCallback(
    async (params: {
      orderNumber?: string;
      orderNumbers?: string[];
      discountCode?: string;
      userIstid?: string;
      phone: string;
      orderSource?: OrderSource;
      items?: StockRequestItem[];
    }) => {
      closeSse();
      setState("waiting");
      setStatusText(options.messages.waiting);
      setTimeLeft(240);

      try {
        const res = await fetch("/api/shop/mbway/new", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderNumber: params.orderNumber || undefined,
            orderNumbers: params.orderNumbers || undefined,
            discount_code: params.discountCode || undefined,
            user_istid: params.userIstid || undefined,
            phone: params.phone,
            order_source: params.orderSource,
            items: params.items,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.requestId)
          throw new Error(data.error || options.messages.request_error);

        const reqId = String(data.requestId);
        const resolvedOrderNumber = String(data.orderNumber || params.orderNumber || "");
        setRequestId(reqId);

        const sseUrl = `/api/shop/mbway/status?requestId=${encodeURIComponent(
          reqId
        )}&orderNumber=${encodeURIComponent(resolvedOrderNumber)}`;
        const es = new EventSource(sseUrl);
        eventSourceRef.current = es;

        es.addEventListener("paid", async () => {
          closeSse();
          setState("success");
          setStatusText(options.messages.success);
          if (options.onPaid) {
            await options.onPaid({
              requestId: reqId,
              orderNumber: resolvedOrderNumber,
            });
          }
        });

        es.addEventListener("declined", () => {
          closeSse();
          setState("error");
          const msg = options.messages.declined;
          setStatusText(msg);
          options.onDeclined?.(msg);
        });

        es.addEventListener("expired", () => {
          closeSse();
          setState("error");
          const msg = options.messages.expired;
          setStatusText(msg);
          options.onExpired?.(msg);
        });

        es.addEventListener("failed", () => {
          closeSse();
          setState("error");
          const msg = options.messages.failed;
          setStatusText(msg);
          options.onFailed?.(msg);
        });

        es.onerror = () => {
          // SSE auto-reconnects until safeClose
        };

        return {
          success: true,
          requestId: reqId,
          orderNumber: resolvedOrderNumber,
        };
      } catch (err: unknown) {
        closeSse();
        setState("error");
        const msg = err instanceof Error ? err.message : options.messages.service_error;
        setStatusText(msg);
        options.onError?.(msg);
        throw err;
      }
    },
    [closeSse, options]
  );

  return {
    state,
    setState,
    statusText,
    setStatusText,
    timeLeft,
    formattedTimeLeft: formatTimer(timeLeft),
    requestId,
    startPayment,
    cancel,
    reset,
    closeSse,
  };
}
