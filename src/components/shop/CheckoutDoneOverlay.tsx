"use client";
import { useRouter } from "next/navigation";
import { FaCheck, FaSpinner } from "react-icons/fa";
import { useEffect, useState, useRef, useCallback } from "react";
import styles from "@/styles/components/shop/CheckoutFormOverlay.module.css";
import type { PaymentMethod, Order } from "@/types/shop";
import type { CheckoutData, CheckoutResponse, SumUpCardInstance } from "@/types/sumup";

interface Props {
  orderId: number | null;
  paymentMethod: PaymentMethod;
}

type FlowState = "loading" | "widget" | "processing" | "success" | "error";

export default function CheckoutDoneOverlay({ orderId, paymentMethod }: Props) {
  const router = useRouter();
  const isInPerson = paymentMethod === "in-person";
  const isSumUp = paymentMethod === "sumup";

  const [flowState, setFlowState] = useState<FlowState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [retryCount, setRetryCount] = useState(0);
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
    if (!isSumUp || !orderId) return;
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
  }, [isSumUp, orderId]);

  useEffect(() => {
    if (!isSumUp || !orderId) return;
    if (checkoutId) return;
    if (!order) return;
    let mounted = true;

    const createCheckout = async () => {
      try {
        const amountValue = (Math.round(Number(order.total_amount) * 100) / 100).toFixed(2);
        const res = await fetch("/api/shop/sumup/new", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            amount: amountValue,
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
  }, [isSumUp, orderId, checkoutId, order]);

  // Mount SumUp widget
  useEffect(() => {
    if (!isSumUp || !checkoutId) return;
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
  }, [isSumUp, checkoutId, loadSumUpScript, verifyCheckout]);

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

  if (!isSumUp) {
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
