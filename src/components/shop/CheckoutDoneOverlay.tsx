"use client";
import { useRouter } from "next/navigation";
import { FaCheck, FaSpinner } from "react-icons/fa";
import { useEffect, useState, useRef, useCallback } from "react";
import styles from "@/styles/components/shop/CheckoutFormOverlay.module.css";
import type { PaymentMethod, Order } from "@/types/shop";
import type {
  ApplePayPaymentRequest,
  ApplePayPaymentToken,
  CheckoutData,
  CheckoutResponse,
  SumUpCardInstance,
} from "@/types/sumup";

interface Props {
  orderId: number | null;
  paymentMethod: PaymentMethod;
}

type FlowState = "loading" | "widget" | "processing" | "success" | "error";

export default function CheckoutDoneOverlay({ orderId, paymentMethod }: Props) {
  const router = useRouter();
  const isInPerson = paymentMethod === "in-person";
  const isOnlinePayment = paymentMethod === "sumup" || paymentMethod === "apple-pay";

  const [flowState, setFlowState] = useState<FlowState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const MAX_RETRIES = 3;
  const MAX_VERIFICATION_ATTEMPTS = 3;
  const widgetInstanceRef = useRef<SumUpCardInstance | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const safetyTimerRef = useRef<number | null>(null);
  const ABORT_TIMEOUT_MS = 90_000;

  const finalizeAndNavigate = useCallback(
    (path?: string) => {
      localStorage.setItem("cart", "[]");
      window.dispatchEvent(new Event("cartUpdated"));
      if (path) router.push(path);
      else router.push("/my-orders");
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
      } catch (e) {
        console.error("cancelOrder error", e);
      } finally {
        finalizeAndNavigate("/my-orders");
      }
    },
    [finalizeAndNavigate]
  );

  const verifyCheckout = useCallback(
    async (cid: string) => {
      try {
        const res = await fetch("/api/shop/sumup/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkoutId: cid, orderId }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          message?: string;
        } | null;

        if (!res.ok) {
          return false;
        } else if (data?.ok) {
          return true;
        } else {
          return false;
        }
      } catch (err) {
        console.error("verifyCheckout error", err);
        return false;
      }
    },
    [orderId]
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
        label: "NEIIST",
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
        if (safetyTimerRef.current) {
          clearTimeout(safetyTimerRef.current);
          safetyTimerRef.current = null;
        }
        setFlowState("processing");

        const res = await fetch("/api/shop/sumup/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checkoutId,
            orderId,
            applePayToken: event.payment.token as ApplePayPaymentToken,
          }),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };

        if (res.ok && data?.ok) {
          session.completePayment(ApplePaySession.STATUS_SUCCESS);
          setFlowState("success");
        } else {
          session.completePayment(ApplePaySession.STATUS_FAILURE);
          setError(data?.error || "Pagamento Apple Pay falhou. Tenta novamente.");
          setFlowState("error");
          setRetryCount((count) => count + 1);
        }
      } catch (err) {
        console.error("Apple Pay processing error:", err);
        session.completePayment(ApplePaySession.STATUS_FAILURE);
        setError("Erro ao processar Apple Pay. Tenta novamente.");
        setFlowState("error");
        setRetryCount((count) => count + 1);
      }
    };

    session.oncancel = () => {
      if (flowState === "processing") return;
      setFlowState("widget");
    };

    session.begin();
  }, [checkoutId, order, orderId, flowState]);

  const loadSumUpScript = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (typeof window === "undefined") return reject();
      if (window.SumUpCard) return resolve();
      const src = "https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js";
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject());
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.body.appendChild(script);
    });
  }, []);

  useEffect(() => {
    if (!isOnlinePayment || !orderId) return;
    let mounted = true;
    fetch(`/api/shop/orders/${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        const d = data as Order & { error?: string; payment_reference?: string };
        if (d?.error) {
          setError(d.error || "Failed to fetch order");
          setFlowState("error");
        } else {
          setOrder(d);
          if (d.payment_reference) {
            setCheckoutId(String(d.payment_reference));
          }
        }
      })
      .catch(() => {
        if (mounted) {
          setError("Network error fetching order");
          setFlowState("error");
        }
      });
    return () => {
      mounted = false;
    };
  }, [isOnlinePayment, orderId]);

  useEffect(() => {
    if (!isOnlinePayment || !orderId) return;
    if (checkoutId) return;
    if (!order) return;
    let mounted = true;

    const createCheckout = async () => {
      try {
        const res = await fetch("/api/shop/sumup/new", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            currency: "EUR",
            checkout_reference: `order-${orderId}`,
          }),
        });

        const data = (await res.json()) as {
          checkoutId?: string;
          id?: string;
          error?: string;
          message?: string;
        } | null;
        if (!mounted) return;
        if (!res.ok) {
          setError(data?.error || data?.message || "Falha ao criar checkout SumUp");
          setFlowState("error");
          console.error("create-checkout error:", data);
        } else {
          const cid = data?.checkoutId ?? data?.id;
          if (cid) {
            setCheckoutId(String(cid));
          } else {
            console.error("No checkout ID in response:", data);
            setError("Resposta inesperada do serviço de pagamento");
            setFlowState("error");
          }
        }
      } catch (err) {
        console.error("Network error creating checkout:", err);
        if (mounted) {
          setError("Erro de rede ao criar checkout.");
          setFlowState("error");
        }
      }
    };

    createCheckout();

    return () => {
      mounted = false;
    };
  }, [isOnlinePayment, orderId, checkoutId, order]);

  // Mount SumUp widget
  useEffect(() => {
    if (!isOnlinePayment || !checkoutId) return;
    const timeoutId = setTimeout(() => {
      if (!containerRef.current) {
        return;
      }
      mountWidget();
    }, 100);
    const mountWidget = async () => {
      let mounted = true;

      try {
        await loadSumUpScript();
        const waitFor = (fn: () => boolean, ms = 4000) =>
          new Promise<void>((resolve, reject) => {
            const start = Date.now();
            const iv = setInterval(() => {
              if (fn()) {
                clearInterval(iv);
                resolve();
              } else if (Date.now() - start > ms) {
                clearInterval(iv);
                reject(new Error("SumUp SDK load timeout"));
              }
            }, 100);
          });

        await waitFor(() => !!window.SumUpCard, 4000);
        if (!mounted) return;

        try {
          if (widgetInstanceRef.current?.unmount) {
            widgetInstanceRef.current.unmount();
            widgetInstanceRef.current = null;
          }
        } catch {}

        const innerId = "sumup-card";
        let inner = document.getElementById(innerId);
        if (containerRef.current) {
          if (!inner || !containerRef.current.contains(inner)) {
            inner = document.createElement("div");
            inner.id = innerId;
            inner.style.width = "100%";
            inner.style.height = "100%";
            containerRef.current.innerHTML = "";
            containerRef.current.appendChild(inner);
          }
        }

        const SumUpCard = window.SumUpCard;
        if (!SumUpCard || typeof SumUpCard.mount !== "function") {
          throw new Error("SumUpCard SDK not available");
        }

        if (safetyTimerRef.current) {
          clearTimeout(safetyTimerRef.current);
          safetyTimerRef.current = null;
        }

        const instance = SumUpCard.mount({
          checkoutId: checkoutId as string,
          container: `#${innerId}`,
          showFooter: true,
          onResponse: async (
            type: string,
            body: CheckoutData | CheckoutResponse | Record<string, unknown>
          ) => {
            const t = String(type || "").toLowerCase();

            // Only handle success - ignore fail/error as they're intermediate
            if (t === "success" || t === "paid" || t === "sent") {
              if (safetyTimerRef.current) {
                clearTimeout(safetyTimerRef.current);
                safetyTimerRef.current = null;
              }

              const cid =
                (body as CheckoutResponse).id ??
                (body as CheckoutResponse).data?.id ??
                (body as CheckoutResponse).checkoutId ??
                (body as CheckoutResponse).checkout_id ??
                (body as CheckoutData).checkout_reference ??
                (body as CheckoutData).checkoutReference ??
                checkoutId;

              if (cid) {
                // Show processing
                setFlowState("processing");

                // Try verification multiple times
                let success = false;
                for (let attempt = 0; attempt < MAX_VERIFICATION_ATTEMPTS; attempt++) {
                  success = await verifyCheckout(String(cid));
                  if (success) break;

                  // Wait before retry (except on last attempt)
                  if (attempt < MAX_VERIFICATION_ATTEMPTS - 1) {
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                  }
                }

                // Only show final result after all attempts
                if (success) {
                  try {
                    if (widgetInstanceRef.current?.unmount) {
                      widgetInstanceRef.current.unmount();
                    }
                  } catch {}
                  widgetInstanceRef.current = null;
                  setFlowState("success");
                } else {
                  setError(
                    "Não foi possível confirmar o pagamento. Por favor, contacta o suporte."
                  );
                  setFlowState("error");
                  setRetryCount((c) => c + 1);
                }
              } else {
                setError("Checkout id não disponível para verificação.");
                setFlowState("error");
                setRetryCount((c) => c + 1);
              }
            }
            // Ignore fail/error events - they're intermediate states
          },
        });

        widgetInstanceRef.current = instance;
        setFlowState("widget");
        safetyTimerRef.current = window.setTimeout(() => {
          safetyTimerRef.current = null;
          setError("Tempo de resposta do widget excedido. Tente novamente.");
          setFlowState("error");
          setRetryCount((c) => c + 1);
        }, ABORT_TIMEOUT_MS);
      } catch (err) {
        console.error("Failed to mount SumUp widget:", err);
        if (mounted) {
          setError("Erro ao carregar o módulo de pagamento SumUp.");
          setFlowState("error");
        }
      }
    };

    return () => {
      clearTimeout(timeoutId);
      try {
        if (safetyTimerRef.current) {
          clearTimeout(safetyTimerRef.current);
          safetyTimerRef.current = null;
        }
        if (widgetInstanceRef.current?.unmount) {
          widgetInstanceRef.current.unmount();
          widgetInstanceRef.current = null;
        }
      } catch {}
    };
  }, [isOnlinePayment, checkoutId, loadSumUpScript, verifyCheckout]);

  const retryPayment = useCallback(async () => {
    if (retryCount >= MAX_RETRIES) {
      setError("Tentativas esgotadas. A encomenda será cancelada.");
      await cancelOrder(orderId);
      return;
    }

    try {
      if (widgetInstanceRef.current?.unmount) {
        widgetInstanceRef.current.unmount();
      }
    } catch {}

    widgetInstanceRef.current = null;
    setError(null);
    setCheckoutId(null);
    setFlowState("loading");
    if (orderId) {
      fetch(`/api/shop/orders/${orderId}`)
        .then((r) => r.json())
        .then((data) => {
          const d = data as Order & { error?: string; payment_reference?: string };
          if (d?.error) {
            setError(d.error);
            setFlowState("error");
          } else {
            setOrder(d);
          }
        })
        .catch(() => {
          setError("Network error");
          setFlowState("error");
        });
    }
  }, [retryCount, orderId, cancelOrder]);

  const handleViewOrders = useCallback(() => {
    finalizeAndNavigate(orderId != null ? `/my-orders?orderId=${orderId}` : "/my-orders");
  }, [orderId, finalizeAndNavigate]);

  const handleCancel = useCallback(() => {
    finalizeAndNavigate("/my-orders");
  }, [finalizeAndNavigate]);

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
      {checkoutId && (
        <div
          className={styles.widgetOnly}
          style={{
            display: flowState === "loading" || flowState === "widget" ? "block" : "none",
          }}>
          <div ref={containerRef} className={styles.widgetContainer}>
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
      )}

      {flowState === "processing" && (
        <div className={styles.panel}>
          <div className={styles.spinnerWrapper}>
            <FaSpinner size={48} className={styles.spinner} />
          </div>
          <h2 className={styles.title}>A verificar pagamento...</h2>
          <p className={styles.muted}>Aguarda um momento</p>
        </div>
      )}

      {flowState === "success" && (
        <div className={styles.panel}>
          <div className={styles.checkIcon}>
            <FaCheck size={48} />
          </div>
          <h2 className={styles.title}>Pagamento Confirmado!</h2>
          <p className={styles.muted}>A tua encomenda foi processada com sucesso.</p>
          <div className={styles.actionButtons}>
            <button onClick={handleViewOrders} className={styles.btnPrimary}>
              Ver as Minhas Encomendas
            </button>
          </div>
        </div>
      )}

      {flowState === "error" && (
        <div className={styles.errorPanel}>
          <h2 className={styles.errorTitle}>Erro no Pagamento</h2>
          <p className={styles.errorMessage}>
            {error || "Ocorreu um erro ao processar o pagamento"}
          </p>
          {retryCount < MAX_RETRIES && (
            <p className={styles.retryInfo}>
              Tentativa {retryCount + 1} de {MAX_RETRIES + 1}
            </p>
          )}
          <div className={styles.errorActions}>
            {retryCount < MAX_RETRIES && (
              <button onClick={retryPayment} className={styles.btnPrimary}>
                Tentar Novamente
              </button>
            )}
            <button onClick={handleCancel} className={styles.btnSecondary}>
              {retryCount >= MAX_RETRIES ? "Cancelar Encomenda" : "Voltar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
