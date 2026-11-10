"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { FiSmartphone, FiClock } from "react-icons/fi";
import { Badge, Button, Heading, Spinner, Stack, Text } from "@neiist/ui";
import styles from "@/styles/components/shop/checkout/ShopCheckoutOverlay.module.css";
import PendingPaymentOverlay from "@/components/shop/checkout/PendingPaymentOverlay";
import { Order } from "@/types/shop/order";
import { PaymentMethod, isPaymentMethodAllowedForChannel } from "@/types/shop/payment";
import { useMbWayPayment, formatTimer } from "@/hooks/shop/useMbWayPayment";
import { cancelOrderAction } from "@/actions/shop/orders";
import type {
  SumUpCardInstance,
  SumUpCardMountOptions,
  SumUpCardResponseBody,
  SumUpCardResponseType,
  ApplePayPaymentRequest,
  ApplePayPaymentToken,
  VerifyCheckoutResponse,
  CreateCheckoutResponse,
} from "@/types/shop/sumup";
import type { Dictionary } from "@/i18n/dictionaries";

type FlowState = "loading" | "widget" | "mbway" | "processing" | "success" | "error";
type VerifyResult = "paid" | "pending" | "failed";

interface Props {
  orderNumber?: string;
  paymentMethod?: PaymentMethod | null;
  customerPhone?: string;
  dict: Dictionary["checkout_overlay"];
  pendingPaymentDict: Dictionary["pending_payment"];
  paymentsDict: Dictionary["payments"];
  onSwitchToReservation: (_orderNumber: string) => Promise<void>;
  basePath?: string;
}

const WIDGET_SCRIPT_SRC = "https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js";
const MAX_RETRIES = 3;

export default function ShopCheckoutOverlay({
  orderNumber,
  paymentMethod,
  customerPhone,
  dict,
  pendingPaymentDict,
  paymentsDict,
  onSwitchToReservation,
  basePath,
}: Props) {
  const router = useRouter();
  const isOnlinePayment = Boolean(
    paymentMethod && isPaymentMethodAllowedForChannel("web", paymentMethod)
  );
  const isMbWay = paymentMethod === "mbway";
  const isSumUpOrApplePay = paymentMethod === "sumup" || paymentMethod === "apple-pay";
  const targetOrderIdentifier = orderNumber ?? null;
  const shouldLoadOrder = Boolean(targetOrderIdentifier);

  const [flowState, setFlowState] = useState<FlowState>("loading");
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [sessionAmount, setSessionAmount] = useState<number | null>(null);
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isFallbackSubmitting, setIsFallbackSubmitting] = useState(false);

  const {
    timeLeft: mbWayTimeLeft,
    startPayment: startMbWayPayment,
    closeSse: closeMbWaySse,
  } = useMbWayPayment({
    messages: paymentsDict.mbway,
    onPaid: () => {
      setFlowState("success");
    },
    onDeclined: (msg) => {
      setError(msg ?? paymentsDict.mbway.declined);
      setFlowState("error");
    },
    onExpired: (msg) => {
      setError(msg ?? paymentsDict.mbway.expired);
      setFlowState("error");
    },
    onFailed: (msg) => {
      setError(msg ?? paymentsDict.mbway.failed);
      setFlowState("error");
    },
    onError: (msg) => {
      setError(msg);
      setFlowState("error");
    },
  });

  useEffect(() => {
    if (!shouldLoadOrder || !targetOrderIdentifier) return;
    const controller = new AbortController();
    fetch(`/api/shop/orders/${encodeURIComponent(String(orderNumber))}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Order | null) => {
        if (data) setOrder(data);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
      });
    return () => {
      controller.abort();
    };
  }, [shouldLoadOrder, targetOrderIdentifier, orderNumber, isOnlinePayment]);

  const widgetRef = useRef<SumUpCardInstance | null>(null);
  const checkoutRequestPromiseRef = useRef<Promise<CreateCheckoutResponse> | null>(null);
  const verifyingRef = useRef(false);
  const lastVerifyStatusRef = useRef<string | null>(null);
  const abortTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAbortTimer = useCallback(() => {
    if (abortTimerRef.current) {
      clearTimeout(abortTimerRef.current);
      abortTimerRef.current = null;
    }
  }, []);

  const unmountWidget = useCallback(() => {
    try {
      widgetRef.current?.unmount?.();
    } catch {
      // ignore
    }
    widgetRef.current = null;
  }, []);

  const finalizeAndNavigate = useCallback(
    (path?: string) => {
      closeMbWaySse();
      localStorage.setItem("cart", "[]");
      window.dispatchEvent(new Event("cartUpdated"));
      router.push(path ?? `${basePath || ""}/my-orders`);
    },
    [router, basePath, closeMbWaySse]
  );

  const cancelOrder = useCallback(
    async (targetOrderNumber: string) => {
      try {
        await cancelOrderAction(targetOrderNumber).catch(() => {});
        await fetch("/api/shop/checkout/discard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderNumber: targetOrderNumber }),
        }).catch(() => {});
      } catch (err) {
        console.error("cancelOrder error", err);
      } finally {
        finalizeAndNavigate(`${basePath || ""}/my-orders`);
      }
    },
    [finalizeAndNavigate, basePath]
  );

  const checkPaymentStatus = useCallback(
    async (cid: string, token?: ApplePayPaymentToken): Promise<VerifyResult> => {
      try {
        const res = await fetch("/api/shop/sumup/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checkoutId: cid,
            orderNumber,
            ...(token ? { applePayToken: token } : {}),
          }),
        });
        const data = (await res.json()) as VerifyCheckoutResponse;
        lastVerifyStatusRef.current = data?.status ?? null;
        if (data?.ok) return "paid";
        if (data?.failed) return "failed";
        return "pending";
      } catch (err) {
        console.warn("checkPaymentStatus network error:", err);
        return "pending";
      }
    },
    [orderNumber]
  );

  const verifyPayment = useCallback(
    async (cid: string, token?: ApplePayPaymentToken) => {
      if (verifyingRef.current) return;

      verifyingRef.current = true;
      clearAbortTimer();
      unmountWidget();
      setError(null);
      setFlowState("processing");

      try {
        let result = await checkPaymentStatus(cid, token);
        if (result === "pending") {
          await new Promise((r) => setTimeout(r, 1000));
          result = await checkPaymentStatus(cid, token);
        }

        if (result === "paid") {
          setFlowState("success");
          return;
        }

        if (result === "failed") {
          const verifyStatus = String(lastVerifyStatusRef.current || "").toLowerCase();
          if (verifyStatus.includes("fail") || verifyStatus.includes("declin")) {
            setError(dict.error_declined);
          } else if (verifyStatus.includes("timeout") || verifyStatus.includes("expired")) {
            setError(dict.error_expired);
          } else {
            setError(dict.error_unconfirmed);
          }
        } else {
          setError(dict.error_unconfirmed);
        }

        setFlowState("error");
        setRetryCount((count) => count + 1);
      } finally {
        verifyingRef.current = false;
      }
    },
    [clearAbortTimer, unmountWidget, checkPaymentStatus, dict]
  );

  // Apple Pay setup
  useEffect(() => {
    if (typeof window === "undefined" || !window.isSecureContext) return;
    try {
      const ApplePaySession = window.ApplePaySession;
      if (ApplePaySession && ApplePaySession.canMakePayments()) {
        setApplePayAvailable(true);
      }
    } catch {
      // not supported
    }
  }, []);

  const handleApplePay = useCallback(() => {
    const ApplePaySession = window.ApplePaySession;
    if (!ApplePaySession || !sessionAmount || !checkoutId) return;

    const request: ApplePayPaymentRequest = {
      currencyCode: "EUR",
      countryCode: "PT",
      merchantCapabilities: ["supports3DS"],
      supportedNetworks: ["masterCard", "visa"],
      total: {
        label: "NEIIST",
        amount: sessionAmount.toFixed(2),
        type: "final",
      },
    };

    const session = new ApplePaySession(3, request);
    session.onpaymentauthorized = async (event) => {
      try {
        await verifyPayment(checkoutId, event.payment.token as ApplePayPaymentToken);
        session.completePayment(ApplePaySession.STATUS_SUCCESS);
      } catch {
        session.completePayment(ApplePaySession.STATUS_FAILURE);
      }
    };
    session.begin();
  }, [sessionAmount, checkoutId, verifyPayment]);

  // SumUp Widget mounting
  const loadScript = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (typeof window !== "undefined" && window.SumUpCard) {
        resolve();
        return;
      }
      const existing = document.querySelector(`script[src="${WIDGET_SCRIPT_SRC}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("SumUp script load error")));
        return;
      }
      const script = document.createElement("script");
      script.src = WIDGET_SCRIPT_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("SumUp script load error"));
      document.body.appendChild(script);
    });
  }, []);

  const mountWidget = useCallback(
    async (cid: string) => {
      try {
        await loadScript();
        let attempts = 0;
        await new Promise<void>((resolve, reject) => {
          const interval = setInterval(() => {
            if (typeof window !== "undefined" && window.SumUpCard) {
              clearInterval(interval);
              resolve();
            } else if (++attempts > 50) {
              clearInterval(interval);
              reject(new Error("SumUpCard SDK timeout"));
            }
          }, 100);
        });
      } catch (err) {
        console.error("SumUp SDK load failed:", err);
        setError(paymentsDict.module_load_error);
        setFlowState("error");
        setRetryCount((count) => count + 1);
        return;
      }

      unmountWidget();

      const mountOptions: SumUpCardMountOptions = {
        checkoutId: cid,
        id: "sumup-card",
        locale: "pt-PT",
        showFooter: true,
        onLoad: () => setFlowState("widget"),
        onResponse: async (type: SumUpCardResponseType, body: SumUpCardResponseBody) => {
          if (type === "auth-screen" || type === "sent") {
            setFlowState("widget");
            return;
          }
          if (type === "invalid") {
            setError(dict.error_invalid_card);
            return;
          }
          if (type === "error") {
            const errorBody = body as { message?: string };
            setError(errorBody?.message || dict.error_processing);
            setFlowState("error");
            setRetryCount((count) => count + 1);
            return;
          }
          if (type === "fail") {
            clearAbortTimer();
            unmountWidget();
            setError(dict.error_canceled_or_expired);
            setFlowState("error");
            setRetryCount((count) => count + 1);
            return;
          }
          if (type === "success") {
            const checkoutBody = body as { id?: string; checkout_id?: string };
            const bodyId = checkoutBody.id ?? checkoutBody.checkout_id;
            await verifyPayment(String(bodyId ?? cid));
          }
        },
      };

      widgetRef.current = window.SumUpCard!.mount(mountOptions);
    },
    [
      loadScript,
      unmountWidget,
      verifyPayment,
      clearAbortTimer,
      dict,
      paymentsDict.module_load_error,
    ]
  );

  // Initialize SumUp checkout if method is sumup or apple-pay
  useEffect(() => {
    if (!isSumUpOrApplePay || !orderNumber || checkoutId) return;

    let active = true;

    const getCheckoutPromise = () => {
      if (!checkoutRequestPromiseRef.current) {
        checkoutRequestPromiseRef.current = (async () => {
          const res = await fetch("/api/shop/sumup/new", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderNumber }),
          });
          const data = (await res.json().catch(() => ({}))) as CreateCheckoutResponse;
          if (!res.ok || !data.checkoutId)
            throw new Error(data.error ?? dict.error_session_expired);

          return data;
        })().finally(() => {
          checkoutRequestPromiseRef.current = null;
        });
      }
      return checkoutRequestPromiseRef.current;
    };

    void (async () => {
      try {
        const data = await getCheckoutPromise();
        if (!active) return;
        if (!data.checkoutId) {
          setError(dict.error_session_expired);
          setFlowState("error");
          return;
        }
        if (typeof data.amount === "number") setSessionAmount(data.amount);

        setError(null);
        setFlowState("loading");
        setCheckoutId(data.checkoutId);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : dict.error_processing);
        setFlowState("error");
      }
    })();

    return () => {
      active = false;
    };
  }, [isSumUpOrApplePay, orderNumber, checkoutId, dict]);

  useEffect(() => {
    if (!isSumUpOrApplePay || !checkoutId) return;
    if (flowState === "processing" || flowState === "success") return;

    mountWidget(checkoutId);

    return () => {
      clearAbortTimer();
      unmountWidget();
    };
    // eslint-disable-next-line @eslint-react/exhaustive-deps
  }, [isSumUpOrApplePay, checkoutId, retryCount]);

  // IfThenPay MB WAY real-time SSE initialization
  useEffect(() => {
    if (!isMbWay || !orderNumber) return;
    setFlowState("mbway");
    startMbWayPayment({
      orderNumber,
      phone: customerPhone || "",
    }).catch(() => {});
  }, [isMbWay, orderNumber, customerPhone, retryCount, startMbWayPayment]);

  useEffect(() => {
    return () => {
      clearAbortTimer();
      unmountWidget();
      closeMbWaySse();
    };
  }, [clearAbortTimer, unmountWidget, closeMbWaySse]);

  const retryPayment = useCallback(async () => {
    if (retryCount >= MAX_RETRIES) return;
    unmountWidget();
    closeMbWaySse();
    setError(null);
    setCheckoutId(null);
    setFlowState("loading");
    setRetryCount((count) => count + 1);
  }, [retryCount, unmountWidget, closeMbWaySse]);

  const switchToReservation = useCallback(async () => {
    const target = orderNumber || "";
    if (!target || isFallbackSubmitting) return;
    setIsFallbackSubmitting(true);
    closeMbWaySse();
    setError(null);
    try {
      await onSwitchToReservation(target);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : paymentsDict.reservation.switch_error);
    } finally {
      setIsFallbackSubmitting(false);
    }
  }, [
    orderNumber,
    isFallbackSubmitting,
    closeMbWaySse,
    onSwitchToReservation,
    paymentsDict.reservation.switch_error,
  ]);

  const cancelAfterFailures = useCallback(async () => {
    const targetOrderNumber = orderNumber;
    if (!targetOrderNumber || isFallbackSubmitting) return;
    setIsFallbackSubmitting(true);
    closeMbWaySse();
    try {
      await cancelOrder(targetOrderNumber);
    } finally {
      setIsFallbackSubmitting(false);
    }
  }, [orderNumber, cancelOrder, isFallbackSubmitting, closeMbWaySse]);

  const handleViewOrders = useCallback(() => {
    const targetOrder = orderNumber || "";
    finalizeAndNavigate(
      targetOrder
        ? `${basePath || ""}/my-orders?orderId=${encodeURIComponent(targetOrder)}`
        : `${basePath || ""}/my-orders`
    );
  }, [orderNumber, finalizeAndNavigate, basePath]);

  if (!isOnlinePayment) {
    return (
      <PendingPaymentOverlay
        order={order}
        onAction={handleViewOrders}
        actionLabel={dict.continue}
        dict={pendingPaymentDict}
        paymentsDict={paymentsDict}
      />
    );
  }

  return (
    <div className={styles.overlay}>
      {isSumUpOrApplePay && (
        <div
          className={`${styles.widgetOnly}${
            flowState === "loading" || flowState === "widget" ? "" : ` ${styles.hidden}`
          }`}>
          <div className={styles.widgetContainer}>
            <div id="sumup-card" className={styles.cardElement} />
          </div>

          {paymentMethod === "sumup" && applePayAvailable && (
            <div className={styles.applePaySection}>
              <div className={styles.applePayDivider}>
                <span>{dict.or_pay_with}</span>
              </div>
              <button
                className={styles.applePayButton}
                onClick={handleApplePay}
                aria-label={dict.pay_apple_pay}
              />
            </div>
          )}
        </div>
      )}

      {isMbWay && flowState === "mbway" && (
        <div className={styles.widgetOnly}>
          <Stack align="center" gap="md" className={styles.cardContent}>
            <FiSmartphone size={44} color="var(--primary-colour)" />
            <Heading level={2}>{paymentsDict.mbway.title}</Heading>
            <Text className={styles.centerText}>
              {customerPhone
                ? paymentsDict.mbway.instructions_with_phone.replace("{phone}", customerPhone)
                : paymentsDict.mbway.instructions_without_phone}
            </Text>
            <Badge variant="outline" size="md" className={styles.timerBadge}>
              <FiClock /> {formatTimer(mbWayTimeLeft)}
            </Badge>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={switchToReservation}
                disabled={isFallbackSubmitting}>
                {paymentsDict.reservation.action_label}
              </Button>
            </div>
          </Stack>
        </div>
      )}

      {(flowState === "processing" || flowState === "success") && (
        <Spinner
          state={flowState === "success" ? "success" : "loading"}
          title={flowState === "success" ? dict.payment_confirmed : dict.verifying_payment}
          subtitle={flowState === "success" ? dict.order_processed : dict.wait_moment}
          size={flowState === "success" ? 56 : 48}
          actionLabel={flowState === "success" ? dict.view_my_orders : undefined}
          onAction={flowState === "success" ? handleViewOrders : undefined}
        />
      )}

      {flowState === "error" && (
        <div className={styles.errorPanel}>
          <Stack align="center" gap="md">
            <Heading level={2} className={styles.errorTitle}>
              {dict.payment_error}
            </Heading>
            <Text className={styles.centerText}>{error ?? dict.default_payment_error}</Text>
            <div className={styles.errorActions}>
              {retryCount < MAX_RETRIES && (
                <Button variant="primary" onClick={retryPayment}>
                  {dict.retry}
                </Button>
              )}
              {retryCount < MAX_RETRIES ? (
                <Button
                  variant="outline"
                  onClick={switchToReservation}
                  disabled={isFallbackSubmitting}>
                  {paymentsDict.reservation.action_label}
                </Button>
              ) : (
                <>
                  <Button
                    variant="primary"
                    onClick={switchToReservation}
                    disabled={isFallbackSubmitting}>
                    {paymentsDict.reservation.action_label}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={cancelAfterFailures}
                    disabled={isFallbackSubmitting}>
                    {dict.cancel_order}
                  </Button>
                </>
              )}
            </div>
          </Stack>
        </div>
      )}
    </div>
  );
}
