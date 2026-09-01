"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/components/shop/ShopCheckoutOverlay.module.css";
import PaymentProcessingSpinner from "@/components/shop/PaymentProcessingSpinner";
import PendingPaymentOverlay from "@/components/shop/PendingPaymentOverlay";
import { Order } from "@/types/shop/order";
import {
  PaymentMethod,
  ONLINE_PAYMENT_METHODS,
  PENDING_PAYMENT_METHODS,
} from "@/types/shop/payment";
import type {
  SumUpCardInstance,
  SumUpCardMountOptions,
  SumUpCardResponseBody,
  SumUpCardResponseType,
  ApplePayPaymentRequest,
  ApplePayPaymentToken,
  VerifyCheckoutResponse,
  CreateCheckoutResponse,
  ApiErrorResponse,
} from "@/types/sumup";
import type { Dictionary } from "@/i18n/dictionaries";

type FlowState = "loading" | "widget" | "processing" | "success" | "error";
type VerifyResult = "paid" | "pending" | "failed";

interface Props {
  orderId: number | null;
  paymentMethod: PaymentMethod;
  dict: Dictionary["checkout_overlay"];
  pendingPaymentDict: Dictionary["pending_payment"];
  basePath?: string;
}

const WIDGET_SCRIPT_SRC = "https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js";
const VERIFY_POLL_INTERVAL_MS = 2_500;
const VERIFY_MAX_WAIT_MS = 10 * 60_000;
const MAX_RETRIES = 3;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function ShopCheckoutOverlay({
  orderId,
  paymentMethod,
  dict,
  pendingPaymentDict,
  basePath,
}: Props) {
  const router = useRouter();
  const isInPerson = PENDING_PAYMENT_METHODS.has(paymentMethod);
  const isOnlinePayment = ONLINE_PAYMENT_METHODS.includes(paymentMethod);
  const shouldLoadOrder = isOnlinePayment || isInPerson;

  const [flowState, setFlowState] = useState<FlowState>("loading");
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isFallbackSubmitting, setIsFallbackSubmitting] = useState(false);

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
      /* unmount may fail if widget was already removed — safe to ignore */
    }
    widgetRef.current = null;
  }, []);

  const finalizeAndNavigate = useCallback(
    (path?: string) => {
      localStorage.setItem("cart", "[]");
      window.dispatchEvent(new Event("cartUpdated"));
      router.push(path ?? `${basePath || ""}/my-orders`);
    },
    [router, basePath]
  );

  const cancelOrder = useCallback(
    async (id: number | null) => {
      if (!id) return;

      try {
        const res = await fetch(`/api/shop/orders/${id}`, { method: "DELETE" });
        if (!res.ok) {
          await fetch("/api/shop/orders/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: id }),
          });
        }
      } catch (error) {
        console.error("cancelOrder error", error);
      } finally {
        finalizeAndNavigate(`${basePath || ""}/my-orders`);
      }
    },
    [finalizeAndNavigate, basePath]
  );

  const verifyOnce = useCallback(
    async (cid: string, token?: ApplePayPaymentToken): Promise<VerifyResult> => {
      try {
        const res = await fetch("/api/shop/sumup/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checkoutId: cid,
            orderId,
            ...(token ? { applePayToken: token } : {}),
          }),
        });
        const data = (await res.json()) as VerifyCheckoutResponse;
        // Keep last status for better error messages in the UI
        lastVerifyStatusRef.current = data?.status ?? null;
        if (data?.ok) return "paid";

        if (data?.failed) return "failed";

        return "pending";
      } catch (err) {
        console.warn("verifyOnce network error (will retry):", err);
        return "pending";
      }
    },
    [orderId]
  );

  const pollUntilTerminal = useCallback(
    async (cid: string): Promise<"paid" | "failed" | "timeout"> => {
      const deadline = Date.now() + VERIFY_MAX_WAIT_MS;
      while (Date.now() < deadline) {
        const result = await verifyOnce(cid);
        if (result === "paid") return "paid";

        if (result === "failed") return "failed";

        await sleep(VERIFY_POLL_INTERVAL_MS);
      }
      return "timeout";
    },
    [verifyOnce]
  );

  const beginVerification = useCallback(
    async (cid: string) => {
      if (verifyingRef.current) return;

      verifyingRef.current = true;
      clearAbortTimer();
      unmountWidget();
      setError(null);
      setFlowState("processing");

      try {
        const result = await pollUntilTerminal(cid);
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
          setError(dict.error_pending_too_long);
        }

        setFlowState("error");
        setRetryCount((count) => count + 1);
      } finally {
        verifyingRef.current = false;
      }
    },
    [clearAbortTimer, unmountWidget, pollUntilTerminal, dict]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!window.isSecureContext) return;

    if (typeof window.ApplePaySession === "undefined") return;

    try {
      setApplePayAvailable(window.ApplePaySession.canMakePayments());
    } catch {
      setApplePayAvailable(false);
    }
  }, []);

  const handleApplePay = useCallback(async () => {
    if (!checkoutId || !order) return;

    const ApplePaySession = window.ApplePaySession;
    if (!ApplePaySession) return;

    const request: ApplePayPaymentRequest = {
      currencyCode: "EUR",
      countryCode: "PT",
      merchantCapabilities: ["supports3DS"],
      supportedNetworks: ["masterCard", "visa"],
      total: {
        label: "NEIIST Shop",
        amount: Number(order.total_amount).toFixed(2),
        type: "final",
      },
    };

    const session = new ApplePaySession(3, request);

    session.onvalidatemerchant = async (event) => {
      try {
        const res = await fetch("/api/shop/sumup/apple-pay-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkoutId, validationUrl: event.validationURL }),
        });
        if (!res.ok) throw new Error("Merchant validation failed");

        const merchantSession = (await res.json()) as unknown;
        session.completeMerchantValidation(merchantSession);
      } catch (err) {
        console.error("Apple Pay merchant validation error:", err);
        session.abort();
        setError(dict.error_apple_pay_validation);
        setFlowState("error");
        setRetryCount((count) => count + 1);
      }
    };

    session.onpaymentauthorized = async (event) => {
      try {
        clearAbortTimer();
        setFlowState("processing");

        const result = await verifyOnce(checkoutId, event.payment.token as ApplePayPaymentToken);

        if (result === "paid") {
          session.completePayment(ApplePaySession.STATUS_SUCCESS);
          setFlowState("success");
        } else {
          session.completePayment(ApplePaySession.STATUS_FAILURE);
          setError(dict.error_apple_pay_failed);
          setFlowState("error");
          setRetryCount((count) => count + 1);
        }
      } catch (error) {
        console.error("Apple Pay processing error:", error);
        session.completePayment(ApplePaySession.STATUS_FAILURE);
        setError(dict.error_apple_pay_processing);
        setFlowState("error");
        setRetryCount((count) => count + 1);
      }
    };

    session.oncancel = () => {
      if (flowState !== "processing") setFlowState("widget");
    };

    session.begin();
  }, [checkoutId, order, flowState, clearAbortTimer, verifyOnce, dict]);

  const loadScript = useCallback(
    () =>
      new Promise<void>((resolve, reject) => {
        if (window.SumUpCard) return resolve();

        const existing = document.querySelector<HTMLScriptElement>(
          `script[src="${WIDGET_SCRIPT_SRC}"]`
        );
        if (existing) {
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener("error", reject, { once: true });
          return;
        }
        const script = document.createElement("script");
        script.src = WIDGET_SCRIPT_SRC;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = reject;
        document.body.appendChild(script);
      }),
    []
  );

  const mountWidget = useCallback(
    async (cid: string) => {
      try {
        await loadScript();
        await new Promise<void>((resolve, reject) => {
          if (window.SumUpCard) return resolve();

          const start = Date.now();
          const interval = setInterval(() => {
            if (window.SumUpCard) {
              clearInterval(interval);
              resolve();
            } else if (Date.now() - start > 5_000) {
              clearInterval(interval);
              reject(new Error("SumUpCard SDK timeout"));
            }
          }, 100);
        });
      } catch (error) {
        console.error("SumUp SDK load failed:", error);
        setError("Erro ao carregar o módulo de pagamento.");
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
        onLoad: () => {
          setFlowState("widget");
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
            await beginVerification(String(bodyId ?? cid));
          }
        },
      };

      widgetRef.current = window.SumUpCard!.mount(mountOptions);
      abortTimerRef.current = setTimeout(() => {
        abortTimerRef.current = null;
        unmountWidget();
        setError(dict.error_session_expired);
        setFlowState("error");
        setRetryCount((count) => count + 1);
      }, VERIFY_MAX_WAIT_MS);
    },
    [loadScript, unmountWidget, beginVerification, clearAbortTimer, dict]
  );

  useEffect(() => {
    if (!shouldLoadOrder || !orderId) return;

    let cancelled = false;
    const controller = new AbortController();

    fetch(`/api/shop/orders/${orderId}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        const orderData = data as Order & { error?: string };
        if (orderData?.error) {
          setError(orderData.error);
          setFlowState("error");
        } else {
          setOrder(orderData);
        }
      })
      .catch((err) => {
        if (!cancelled && err?.name !== "AbortError") {
          setError(dict.error_processing);
          setFlowState("error");
        }
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [shouldLoadOrder, orderId, dict]);

  useEffect(() => {
    if (!isOnlinePayment || !orderId || checkoutId) return;

    let active = true;

    const getCheckoutPromise = () => {
      if (!checkoutRequestPromiseRef.current) {
        checkoutRequestPromiseRef.current = (async () => {
          const res = await fetch("/api/shop/sumup/new", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId }),
          });
          const data = (await res.json().catch(() => ({}))) as CreateCheckoutResponse;

          if (!res.ok || !data.checkoutId) {
            throw new Error(data.error ?? dict.error_session_expired);
          }

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

        const nextCheckoutId = data.checkoutId;
        if (!nextCheckoutId) {
          setError(dict.error_session_expired);
          setFlowState("error");
          return;
        }

        setError(null);
        setFlowState("loading");
        setCheckoutId(nextCheckoutId);
      } catch (error) {
        if (!active) return;

        console.error("Create checkout network error:", error);
        setError(error instanceof Error ? error.message : dict.error_processing);
        setFlowState("error");
      }
    })();

    return () => {
      active = false;
    };
  }, [isOnlinePayment, orderId, checkoutId, dict]);

  useEffect(() => {
    if (!isOnlinePayment || !checkoutId) return;

    if (flowState === "processing" || flowState === "success") return;

    mountWidget(checkoutId);

    return () => {
      clearAbortTimer();
      unmountWidget();
    };
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- intentional: including flowState would cause infinite remount loop
  }, [isOnlinePayment, checkoutId, retryCount]);

  useEffect(() => {
    return () => {
      clearAbortTimer();
      unmountWidget();
    };
  }, [clearAbortTimer, unmountWidget]);

  const retryPayment = useCallback(async () => {
    if (retryCount >= MAX_RETRIES) return;
    unmountWidget();
    setError(null);
    setCheckoutId(null);
    setFlowState("loading");
  }, [retryCount, unmountWidget]);

  const switchToInPerson = useCallback(async () => {
    if (!orderId || isFallbackSubmitting) return;
    setIsFallbackSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/shop/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_method: "in-person" }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as ApiErrorResponse | null;
        throw new Error(payload?.error ?? dict.error_switch_payment);
      }
      finalizeAndNavigate(
        orderId != null
          ? `${basePath || ""}/my-orders?orderId=${orderId}`
          : `${basePath || ""}/my-orders`
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : dict.error_switch_in_person);
    } finally {
      setIsFallbackSubmitting(false);
    }
  }, [orderId, finalizeAndNavigate, isFallbackSubmitting, basePath, dict]);

  const cancelAfterFailures = useCallback(async () => {
    if (!orderId || isFallbackSubmitting) return;

    setIsFallbackSubmitting(true);
    try {
      await cancelOrder(orderId);
    } finally {
      setIsFallbackSubmitting(false);
    }
  }, [orderId, cancelOrder, isFallbackSubmitting]);

  const handleViewOrders = useCallback(() => {
    finalizeAndNavigate(
      orderId != null
        ? `${basePath || ""}/my-orders?orderId=${orderId}`
        : `${basePath || ""}/my-orders`
    );
  }, [orderId, finalizeAndNavigate, basePath]);

  if (!isOnlinePayment) {
    return (
      <PendingPaymentOverlay
        order={order}
        paymentMethod={paymentMethod}
        onAction={handleViewOrders}
        actionLabel={isInPerson ? dict.continue : dict.view_orders}
        dict={pendingPaymentDict}
      />
    );
  }

  return (
    <div className={styles.overlay}>
      <div
        className={styles.widgetOnly}
        style={{
          display: flowState === "loading" || flowState === "widget" ? "block" : "none",
        }}>
        <div className={styles.widgetContainer}>
          <div id="sumup-card" style={{ width: "100%", height: "100%" }} />
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

      {(flowState === "processing" || flowState === "success") && (
        <PaymentProcessingSpinner
          flowState={flowState === "success" ? "success" : "processing"}
          title={flowState === "success" ? dict.payment_confirmed : dict.verifying_payment}
          subtitle={flowState === "success" ? dict.order_processed : dict.wait_moment}
          size={flowState === "success" ? 56 : 48}
          actionLabel={flowState === "success" ? dict.view_my_orders : undefined}
          onAction={flowState === "success" ? handleViewOrders : undefined}
        />
      )}

      {flowState === "error" && (
        <div className={styles.errorPanel}>
          <h2 className={styles.errorTitle}>{dict.payment_error}</h2>
          <p className={styles.errorMessage}>{error ?? dict.default_payment_error}</p>
          <div className={styles.errorActions}>
            {retryCount < MAX_RETRIES && (
              <button onClick={retryPayment} className={styles.btnPrimary}>
                {dict.retry}
              </button>
            )}
            {retryCount < MAX_RETRIES ? (
              <button
                onClick={switchToInPerson}
                className={styles.btnSecondary}
                disabled={isFallbackSubmitting}>
                {dict.pay_in_person}
              </button>
            ) : (
              <>
                <button
                  onClick={switchToInPerson}
                  className={styles.btnPrimary}
                  disabled={isFallbackSubmitting}>
                  {dict.pay_in_person}
                </button>
                <button
                  onClick={cancelAfterFailures}
                  className={styles.btnSecondary}
                  disabled={isFallbackSubmitting}>
                  {dict.cancel_order}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
