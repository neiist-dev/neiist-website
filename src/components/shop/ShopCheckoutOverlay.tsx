"use client";

import { useRouter } from "next/navigation";
import { FaCheck } from "react-icons/fa";
import { useEffect, useRef, useCallback, useState } from "react";
import styles from "@/styles/components/shop/ShopCheckoutOverlay.module.css";
import PaymentProcessingSpinner from "@/components/shop/PaymentProcessingSpinner";
import { Order } from "@/types/shop/order";
import { PaymentMethod } from "@/types/shop/payment";
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

type FlowState = "loading" | "widget" | "processing" | "success" | "error";
type VerifyResult = "paid" | "pending" | "failed";

interface Props {
  orderId: number | null;
  paymentMethod: PaymentMethod;
}

const WIDGET_SCRIPT_SRC = "https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js";
const VERIFY_POLL_INTERVAL_MS = 2_500;
const VERIFY_MAX_WAIT_MS = 10 * 60_000;
const MAX_RETRIES = 3;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function ShopCheckoutOverlay({ orderId, paymentMethod }: Props) {
  const router = useRouter();
  const isInPerson = paymentMethod === "in-person" || paymentMethod === "mbway";
  const isOnlinePayment = paymentMethod === "sumup" || paymentMethod === "apple-pay";

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
    } catch {}
    widgetRef.current = null;
  }, []);

  const finalizeAndNavigate = useCallback(
    (path?: string) => {
      localStorage.setItem("cart", "[]");
      window.dispatchEvent(new Event("cartUpdated"));
      router.push(path ?? "/my-orders");
    },
    [router]
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
        finalizeAndNavigate("/my-orders");
      }
    },
    [finalizeAndNavigate]
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
            setError(
              "Pagamento recusado pelo emissor do cartão. Tenta novamente, usa outro cartão, ou escolhe pagamento presencial."
            );
          } else if (verifyStatus.includes("timeout") || verifyStatus.includes("expired")) {
            setError(
              "A autorização expirou. Tenta novamente para gerar uma nova sessão de pagamento."
            );
          } else {
            setError("Não foi possível confirmar o pagamento após autorização bancária.");
          }
        } else {
          setError(
            "O pagamento está pendente há demasiado tempo. Se já foste cobrado, contacta-nos."
          );
        }

        setFlowState("error");
        setRetryCount((count) => count + 1);
      } finally {
        verifyingRef.current = false;
      }
    },
    [clearAbortTimer, unmountWidget, pollUntilTerminal]
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
        setError("Falha na validação Apple Pay. Tenta novamente.");
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
          setError("Pagamento Apple Pay falhou. Tenta novamente.");
          setFlowState("error");
          setRetryCount((count) => count + 1);
        }
      } catch (error) {
        console.error("Apple Pay processing error:", error);
        session.completePayment(ApplePaySession.STATUS_FAILURE);
        setError("Erro ao processar Apple Pay. Tenta novamente.");
        setFlowState("error");
        setRetryCount((count) => count + 1);
      }
    };

    session.oncancel = () => {
      if (flowState !== "processing") setFlowState("widget");
    };

    session.begin();
  }, [checkoutId, order, flowState, clearAbortTimer, verifyOnce]);

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
            setError("Verifica os dados do cartão e tenta novamente.");
            return;
          }

          if (type === "error") {
            const errorBody = body as { message?: string };
            setError(errorBody?.message || "Erro ao processar pagamento.");
            setFlowState("error");
            setRetryCount((count) => count + 1);
            return;
          }

          if (type === "fail") {
            clearAbortTimer();
            unmountWidget();
            setError("Pagamento cancelado ou expirado. Tenta novamente.");
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
        setError("A sessão de pagamento expirou. Tenta novamente.");
        setFlowState("error");
        setRetryCount((count) => count + 1);
      }, VERIFY_MAX_WAIT_MS);
    },
    [loadScript, unmountWidget, beginVerification, clearAbortTimer]
  );

  useEffect(() => {
    if (!isOnlinePayment || !orderId) return;

    let cancelled = false;
    fetch(`/api/shop/orders/${orderId}`)
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
      .catch(() => {
        if (!cancelled) {
          setError("Erro de rede ao carregar encomenda.");
          setFlowState("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isOnlinePayment, orderId]);

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
            throw new Error(data.error ?? "Falha ao criar sessão de pagamento.");
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
          setError("Falha ao criar sessão de pagamento.");
          setFlowState("error");
          return;
        }

        setError(null);
        setFlowState("loading");
        setCheckoutId(nextCheckoutId);
      } catch (error) {
        if (!active) return;

        console.error("Create checkout network error:", error);
        setError(
          error instanceof Error ? error.message : "Erro de rede ao criar sessão de pagamento."
        );
        setFlowState("error");
      }
    })();

    return () => {
      active = false;
    };
  }, [isOnlinePayment, orderId, checkoutId]);

  useEffect(() => {
    if (!isOnlinePayment || !checkoutId) return;

    if (flowState === "processing" || flowState === "success") return;

    mountWidget(checkoutId);

    return () => {
      clearAbortTimer();
      unmountWidget();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        throw new Error(payload?.error ?? "Falha ao mudar método de pagamento.");
      }
      finalizeAndNavigate(`/my-orders?orderId=${orderId}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao mudar para pagamento presencial.");
    } finally {
      setIsFallbackSubmitting(false);
    }
  }, [orderId, finalizeAndNavigate, isFallbackSubmitting]);

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
    finalizeAndNavigate(orderId != null ? `/my-orders?orderId=${orderId}` : "/my-orders");
  }, [orderId, finalizeAndNavigate]);

  if (!isOnlinePayment) {
    return (
      <div className={styles.overlay}>
        <div className={styles.panel}>
          <div className={styles.checkIcon}>
            <FaCheck size={48} />
          </div>
          <h2 className={styles.title}>
            {isInPerson ? "Encomenda Registada!" : "Encomenda Submetida!"}
          </h2>
          <p className={styles.muted}>
            {isInPerson ? (
              <>
                A tua encomenda foi registada.
                <br />
                Paga presencialmente na banca.
              </>
            ) : (
              <>
                Obrigado pela tua encomenda.
                <br />
                Receberás um email de confirmação em breve.
              </>
            )}
          </p>
          <div className={styles.actionButtons}>
            <button onClick={handleViewOrders} className={styles.btnPrimary}>
              Ver Encomendas
            </button>
          </div>
        </div>
      </div>
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
              <span>ou paga com</span>
            </div>
            <button
              className={styles.applePayButton}
              onClick={handleApplePay}
              aria-label="Pagar com Apple Pay"
            />
          </div>
        )}
      </div>

      {(flowState === "processing" || flowState === "success") && (
        <PaymentProcessingSpinner
          flowState={flowState === "success" ? "success" : "processing"}
          title={flowState === "success" ? "Pagamento Confirmado!" : "A verificar pagamento…"}
          subtitle={
            flowState === "success"
              ? "A tua encomenda foi processada com sucesso."
              : "Aguarda um momento"
          }
          size={flowState === "success" ? 56 : 48}
          actionLabel={flowState === "success" ? "Ver as Minhas Encomendas" : undefined}
          onAction={flowState === "success" ? handleViewOrders : undefined}
        />
      )}

      {flowState === "error" && (
        <div className={styles.errorPanel}>
          <h2 className={styles.errorTitle}>Erro no Pagamento</h2>
          <p className={styles.errorMessage}>
            {error ?? "Ocorreu um erro ao processar o pagamento."}
          </p>
          <div className={styles.errorActions}>
            {retryCount < MAX_RETRIES && (
              <button onClick={retryPayment} className={styles.btnPrimary}>
                Tentar Novamente
              </button>
            )}
            {retryCount < MAX_RETRIES ? (
              <button
                onClick={switchToInPerson}
                className={styles.btnSecondary}
                disabled={isFallbackSubmitting}>
                Pagar em Pessoa
              </button>
            ) : (
              <>
                <button
                  onClick={switchToInPerson}
                  className={styles.btnPrimary}
                  disabled={isFallbackSubmitting}>
                  Pagar em Pessoa
                </button>
                <button
                  onClick={cancelAfterFailures}
                  className={styles.btnSecondary}
                  disabled={isFallbackSubmitting}>
                  Cancelar Encomenda
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
