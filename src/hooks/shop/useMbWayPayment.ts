import { useState, useRef, useEffect, useCallback } from "react";
import { formatTimer } from "@/utils/shop/shopUtils";
import type { Dictionary } from "@/i18n/dictionaries";
import type { StockRequestItem } from "@/types/redis";
import type { OrderSource } from "@/types/shop/order";

export interface UseMbWayPaymentOptions {
  messages: Dictionary["payments"]["mbway"];
  onPaid?: (_data: { requestId: string; orderNumber: string }) => void | Promise<void>;
  onDeclined?: (_message?: string) => void;
  onExpired?: (_message?: string) => void;
  onFailed?: (_message?: string) => void;
  onError?: (_error: string) => void;
}

export function useMbWayPayment(options: UseMbWayPaymentOptions) {
  const [state, setState] = useState<"idle" | "waiting" | "success" | "error">("idle");
  const [statusText, setStatusText] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(240);
  const [requestId, setRequestId] = useState<string | null>(null);

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const eventSourceRef = useRef<EventSource | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const attemptIdRef = useRef(0);

  const closeSse = useCallback(() => {
    attemptIdRef.current += 1;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
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
      const attemptId = attemptIdRef.current;
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setState("waiting");
      setStatusText(optionsRef.current.messages.waiting);
      setTimeLeft(240);

      try {
        const res = await fetch("/api/shop/mbway/new", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
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
        if (attemptId !== attemptIdRef.current) return null;

        if (!res.ok || !data.requestId)
          throw new Error(data.error || optionsRef.current.messages.request_error);

        const reqId = String(data.requestId);
        const resolvedOrderNumber = String(data.orderNumber || params.orderNumber || "");
        setRequestId(reqId);

        const sseUrl = `/api/shop/mbway/status?requestId=${encodeURIComponent(
          reqId
        )}&orderNumber=${encodeURIComponent(resolvedOrderNumber)}`;
        const es = new EventSource(sseUrl);
        eventSourceRef.current = es;

        const handleTerminal = (
          nextState: "success" | "error",
          message: string,
          callback?: (_msg?: string) => void
        ) => {
          if (attemptId !== attemptIdRef.current) return;
          closeSse();
          setState(nextState);
          setStatusText(message);
          callback?.(message);
        };

        es.addEventListener("paid", async () => {
          if (attemptId !== attemptIdRef.current) return;
          closeSse();
          setState("success");
          setStatusText(optionsRef.current.messages.success);
          if (optionsRef.current.onPaid) {
            await optionsRef.current.onPaid({
              requestId: reqId,
              orderNumber: resolvedOrderNumber,
            });
          }
        });

        es.addEventListener("declined", () => {
          handleTerminal("error", optionsRef.current.messages.declined, (m) =>
            optionsRef.current.onDeclined?.(m)
          );
        });

        es.addEventListener("expired", () => {
          handleTerminal("error", optionsRef.current.messages.expired, (m) =>
            optionsRef.current.onExpired?.(m)
          );
        });

        es.addEventListener("failed", () => {
          handleTerminal("error", optionsRef.current.messages.failed, (m) =>
            optionsRef.current.onFailed?.(m)
          );
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
        if (
          (err instanceof Error && err.name === "AbortError") ||
          attemptId !== attemptIdRef.current
        ) {
          return null;
        }
        closeSse();
        setState("error");
        const msg = err instanceof Error ? err.message : optionsRef.current.messages.service_error;
        setStatusText(msg);
        optionsRef.current.onError?.(msg);
        throw err;
      }
    },
    [closeSse]
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
