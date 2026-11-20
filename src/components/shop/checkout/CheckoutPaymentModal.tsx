"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { FiClock } from "react-icons/fi";
import { FaCalendarAlt } from "react-icons/fa";
import { Badge, Button, Modal } from "@neiist/ui";
import styles from "@/styles/components/shop/checkout/CheckoutPaymentModal.module.css";
import PaymentOverlay from "@/components/shop/PaymentOverlay";
import CampusScheduleOverlay from "@/components/shop/manage/modals/CampusScheduleOverlay";
import { Order } from "@/types/shop/order";
import { PaymentMethod, isPaymentMethodAllowedForChannel } from "@/types/shop/payment";
import { useMbWayPayment } from "@/hooks/shop/useMbWayPayment";
import { clearClientCart, formatTimer, getCampusLocation } from "@/utils/shop/shopUtils";
import { getCampusSchedule } from "@/types/schedule";
import { isReservationOrder } from "@/utils/shop/orderStatusUtils";
import type {
  SumUpCardInstance,
  SumUpCardMountOptions,
  SumUpCardResponseBody,
  SumUpCardResponseType,
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
  locale?: string;
  dict: Dictionary["checkout_overlay"];
  pendingPaymentDict: Dictionary["pending_payment"];
  paymentsDict: Dictionary["payments"];
  onCancel?: () => void;
  onHoldEnded?: () => void;
  basePath?: string;
}

const WIDGET_SCRIPT_SRC = "https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js";
const MAX_RETRIES = 3;

export default function CheckoutPaymentModal({
  orderNumber,
  paymentMethod,
  customerPhone,
  locale,
  dict,
  pendingPaymentDict,
  paymentsDict,
  onCancel,
  onHoldEnded,
  basePath,
}: Props) {
  const router = useRouter();
  const sumUpLocale = locale?.toLowerCase().startsWith("en") ? "en-US" : "pt-PT";

  const isOnlinePayment = Boolean(
    paymentMethod && isPaymentMethodAllowedForChannel("web", paymentMethod)
  );
  const isMbWay = paymentMethod === "mbway";
  const isSumUp = paymentMethod === "sumup" || paymentMethod === "apple-pay";
  const targetOrderIdentifier = orderNumber ?? null;
  const shouldLoadOrder = Boolean(targetOrderIdentifier) && !isOnlinePayment;

  const [flowState, setFlowState] = useState<FlowState>("loading");
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const {
    timeLeft: mbWayTimeLeft,
    startPayment: startMbWayPayment,
    closeSse: closeMbWaySse,
  } = useMbWayPayment({
    messages: paymentsDict.mbway,
    onPaid: () => {
      onHoldEnded?.();
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
      onHoldEnded?.();
      clearClientCart();
      router.push(path ?? `${basePath || ""}/my-orders`);
    },
    [router, basePath, closeMbWaySse, onHoldEnded]
  );

  const checkPaymentStatus = useCallback(
    async (cid: string): Promise<VerifyResult> => {
      try {
        const res = await fetch("/api/shop/sumup/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checkoutId: cid,
            orderNumber,
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
    async (cid: string) => {
      if (verifyingRef.current) return;

      verifyingRef.current = true;
      clearAbortTimer();
      unmountWidget();
      setError(null);
      setFlowState("processing");

      try {
        let result = await checkPaymentStatus(cid);
        if (result === "pending") {
          await new Promise((r) => setTimeout(r, 1000));
          result = await checkPaymentStatus(cid);
        }

        if (result === "paid") {
          onHoldEnded?.();
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
      } finally {
        verifyingRef.current = false;
      }
    },
    [clearAbortTimer, unmountWidget, checkPaymentStatus, dict, onHoldEnded]
  );

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
        return;
      }

      unmountWidget();

      const mountOptions: SumUpCardMountOptions = {
        checkoutId: cid,
        id: "sumup-card",
        locale: sumUpLocale,
        showSubmitButton: true,
        showFooter: true,
        onLoad: () => {
          setIsWidgetReady(true);
        },
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
            const errorBody = body as {
              message?: string;
              detail?: string;
              error_code?: string;
            };
            setError(errorBody?.detail || errorBody?.message || dict.error_processing);
            setFlowState("error");
            return;
          }
          if (type === "fail") {
            clearAbortTimer();
            unmountWidget();
            setError(dict.error_canceled_or_expired);
            setFlowState("error");
            return;
          }
          if (type === "success") {
            setFlowState("processing");
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
      sumUpLocale,
    ]
  );

  // Initialize SumUp checkout if method is sumup or apple-pay
  useEffect(() => {
    if (!isSumUp || !orderNumber || checkoutId) return;

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

        setError(null);
        setCheckoutId(data.checkoutId);
        setFlowState("widget");
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : dict.error_processing);
        setFlowState("error");
      }
    })();

    return () => {
      active = false;
    };
  }, [isSumUp, orderNumber, checkoutId, dict]);

  useEffect(() => {
    if (!isSumUp || !checkoutId || flowState !== "widget") return;

    mountWidget(checkoutId);

    return () => {
      clearAbortTimer();
      unmountWidget();
    };
    // eslint-disable-next-line @eslint-react/exhaustive-deps
  }, [isSumUp, checkoutId, flowState, retryCount]);

  // IfThenPay MB WAY real-time SSE initialization
  useEffect(() => {
    if (!isMbWay || !orderNumber) return;
    setFlowState("mbway");
    startMbWayPayment({
      orderNumber,
      phone: customerPhone || "",
    }).catch(() => {});
    return () => {
      closeMbWaySse();
    };
  }, [isMbWay, orderNumber, customerPhone, retryCount, startMbWayPayment, closeMbWaySse]);

  const handleBackToCheckout = useCallback(() => {
    clearAbortTimer();
    unmountWidget();
    closeMbWaySse();
    setIsWidgetReady(false);
    if (isSumUp && checkoutId && flowState !== "success") {
      void fetch("/api/shop/sumup/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutId, orderNumber }),
      }).catch(() => {});
    }
    onCancel?.();
  }, [
    clearAbortTimer,
    unmountWidget,
    closeMbWaySse,
    isSumUp,
    checkoutId,
    flowState,
    orderNumber,
    onCancel,
  ]);

  useEffect(() => {
    return () => {
      clearAbortTimer();
      unmountWidget();
      closeMbWaySse();
    };
  }, [clearAbortTimer, unmountWidget, closeMbWaySse]);

  const retryPayment = useCallback(() => {
    if (retryCount >= MAX_RETRIES) return;
    unmountWidget();
    closeMbWaySse();
    setError(null);
    setCheckoutId(null);
    setIsWidgetReady(false);
    setFlowState("loading");
    setRetryCount((count) => count + 1);
  }, [retryCount, unmountWidget, closeMbWaySse]);

  const handleViewOrders = useCallback(() => {
    const targetOrder = orderNumber || "";
    finalizeAndNavigate(
      targetOrder
        ? `${basePath || ""}/my-orders?orderId=${encodeURIComponent(targetOrder)}`
        : `${basePath || ""}/my-orders`
    );
  }, [orderNumber, finalizeAndNavigate, basePath]);

  if (!isOnlinePayment) {
    if (!order) {
      return (
        <PaymentOverlay
          state="loading"
          title={pendingPaymentDict.loading_details}
          showCloseButton={false}
        />
      );
    }

    const isUnpaidReservation = isReservationOrder(order);

    return (
      <>
        <PaymentOverlay
          state="success"
          title={
            isUnpaidReservation
              ? paymentsDict.reservation.pending_title
              : pendingPaymentDict.title_submitted
          }
          subtitle={
            isUnpaidReservation ? (
              <>
                {paymentsDict.reservation.pending_intro}
                <br />
                {paymentsDict.reservation.pending_location.replace(
                  "{location}",
                  getCampusLocation(order.campus)
                )}
              </>
            ) : (
              <>
                {pendingPaymentDict.thanks_order}
                <br />
                {pendingPaymentDict.confirmation_email}
              </>
            )
          }
          showCloseButton={false}
          primaryAction={{
            label: isUnpaidReservation
              ? paymentsDict.reservation.continue
              : dict.continue || pendingPaymentDict.view_orders,
            onClick: handleViewOrders,
          }}>
          {isUnpaidReservation && order.campus && getCampusSchedule(order.campus) && (
            <div style={{ marginTop: "0.75rem" }}>
              <Button variant="outline" size="sm" onClick={() => setShowScheduleModal(true)}>
                <FaCalendarAlt size={13} /> {pendingPaymentDict.view_schedule}
              </Button>
            </div>
          )}
        </PaymentOverlay>

        <CampusScheduleOverlay
          open={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          campus={order.campus}
          dict={pendingPaymentDict}
        />
      </>
    );
  }

  if (flowState === "error") {
    return (
      <PaymentOverlay
        state="error"
        title={dict.payment_error}
        subtitle={error ?? dict.default_payment_error}
        onClose={onCancel ? handleBackToCheckout : undefined}
        primaryAction={
          retryCount < MAX_RETRIES ? { label: dict.retry, onClick: retryPayment } : undefined
        }
        secondaryAction={
          onCancel ? { label: dict.cancel, onClick: handleBackToCheckout } : undefined
        }
      />
    );
  }

  if (flowState === "success") {
    return (
      <PaymentOverlay
        state="success"
        title={dict.payment_confirmed}
        subtitle={dict.order_processed}
        showCloseButton={false}
        primaryAction={{
          label: dict.view_my_orders,
          onClick: handleViewOrders,
        }}
      />
    );
  }

  if (flowState === "loading" && !isSumUp) {
    return (
      <PaymentOverlay
        state="loading"
        title={dict.wait_moment}
        subtitle={dict.loading}
        onClose={onCancel ? handleBackToCheckout : undefined}
      />
    );
  }

  if (flowState === "processing") {
    return (
      <PaymentOverlay
        state="loading"
        title={dict.verifying_payment}
        subtitle={dict.wait_moment}
        showCloseButton={false}
      />
    );
  }

  if (isMbWay && flowState === "mbway") {
    return (
      <PaymentOverlay
        state="loading"
        title={paymentsDict.mbway.title}
        subtitle={
          customerPhone
            ? paymentsDict.mbway.instructions_with_phone.replace("{phone}", customerPhone)
            : paymentsDict.mbway.instructions_without_phone
        }
        badge={
          <Badge variant="primary" size="md" className={styles.timerBadge}>
            <FiClock /> {formatTimer(mbWayTimeLeft)}
          </Badge>
        }
        onClose={onCancel ? handleBackToCheckout : undefined}
        secondaryAction={
          onCancel ? { label: dict.cancel, onClick: handleBackToCheckout } : undefined
        }
      />
    );
  }

  return (
    <Modal
      open={true}
      onClose={handleBackToCheckout}
      size="md"
      closeOnBackdropClick={false}
      draggable={false}
      showCloseButton={Boolean(onCancel)}
      closeLabel={dict.cancel}>
      {onCancel && (
        <Modal.Header
          className={styles.modalHeader}
          onClose={handleBackToCheckout}
          showCloseButton={true}
          closeLabel={dict.cancel}
        />
      )}
      <Modal.Body className={styles.widgetBody}>
        {!isWidgetReady && (
          <div className={styles.loadingState}>
            <PaymentOverlay
              variant="inline"
              state="loading"
              iconSize={48}
              title={dict.wait_moment}
              subtitle={dict.loading}
            />
          </div>
        )}
        <div
          id="sumup-card"
          className={`${styles.cardElement}${!isWidgetReady ? ` ${styles.hidden}` : ""}`}
        />
      </Modal.Body>
    </Modal>
  );
}
