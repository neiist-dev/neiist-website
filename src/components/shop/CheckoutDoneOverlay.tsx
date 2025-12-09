"use client";
import { useRouter } from "next/navigation";
import { FaCheck } from "react-icons/fa";
import { useEffect, useState, useRef, useCallback } from "react";
import styles from "@/styles/components/shop/CheckoutFormOverlay.module.css";
import type { PaymentMethod, Order } from "@/types/shop";

interface Props {
  orderId: number | null;
  paymentMethod: PaymentMethod;
}

export default function CheckoutDoneOverlay({ orderId, paymentMethod }: Props) {
  const router = useRouter();
  const isInPerson = paymentMethod === "in-person";
  const isSumUp = paymentMethod === "sumup";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const finalizeAndNavigate = useCallback(
    (path?: string) => {
      localStorage.setItem("cart", "[]");
      window.dispatchEvent(new Event("cartUpdated"));
      if (path) router.push(path);
      else router.push("/my-orders");
    },
    [router]
  );

  const verifyCheckout = useCallback(
    async (cid: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/shop/sumup/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkoutId: cid, orderId }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || "Falha ao verificar pagamento");
        } else if (data?.ok) {
          finalizeAndNavigate(orderId != null ? `/my-orders?orderId=${orderId}` : "/my-orders");
        } else {
          setError(data?.message || "Pagamento não concluído");
        }
      } catch {
        setError("Erro de rede ao verificar pagamento");
      } finally {
        setLoading(false);
        setCheckoutId(null);
      }
    },
    [orderId, finalizeAndNavigate]
  );

  useEffect(() => {
    if (!isSumUp || !orderId) return;
    let mounted = true;
    setLoading(true);
    setError(null);
    fetch(`/api/shop/orders/${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        if (data?.error) {
          setError(data.error || "Failed to fetch order");
        } else {
          setOrder(data);
          if (data.payment_reference) setCheckoutId(data.payment_reference);
        }
      })
      .catch(() => setError("Network error fetching order"))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [isSumUp, orderId]);

  useEffect(() => {
    if (!isSumUp || !orderId) return;
    if (checkoutId) return;
    if (!order) return;
    const createCheckout = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/shop/sumup/new", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            amount: Math.round(order.total_amount * 100),
            currency: "EUR",
            checkout_reference: `order-${orderId}`,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || "Falha ao criar checkout SumUp");
        } else {
          setCheckoutId(data.checkoutId);
        }
      } catch {
        setError("Erro de rede ao criar checkout.");
      } finally {
        setLoading(false);
      }
    };
    createCheckout();
  }, [isSumUp, orderId, checkoutId, order]);

  useEffect(() => {
    const handler = (ev: MessageEvent) => {
      if (!ev.data || typeof ev.data !== "object") return;
      const { type, payload } = ev.data;
      if (type === "sumup:widget:response") {
        const widgetType = payload?.type;
        const body = payload?.body;
        if (widgetType === "success" || widgetType === "sent" || widgetType === "paid") {
          const cid = body?.id || body?.checkout?.id || checkoutId;
          if (cid) verifyCheckout(cid);
          else setError("Checkout id não disponível para verificação.");
        } else if (widgetType === "auth-screen") {
          // User is in auth screen, do nothing
        } else if (widgetType === "fail" || widgetType === "error") {
          setError("Pagamento cancelado ou ocorreu erro no widget.");
          setCheckoutId(null);
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [checkoutId, verifyCheckout]);

  const handleViewOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    finalizeAndNavigate(orderId != null ? `/my-orders?orderId=${orderId}` : "/my-orders");
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.panel} style={{ maxWidth: isSumUp ? 880 : undefined }}>
        {!isSumUp && (
          <>
            <div className={styles.checkIcon}>
              <FaCheck size={48} strokeWidth={3} />
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
            {orderId && (
              <a
                className={styles.link}
                href={`/my-orders?orderId=${orderId}`}
                onClick={handleViewOrder}>
                Ver encomenda
              </a>
            )}
          </>
        )}

        {isSumUp && (
          <div style={{ width: 820, position: "relative" }}>
            <h2 className={styles.title}>Pagamento Seguro provided by SumUp</h2>
            <p className={styles.muted}>
              Um módulo seguro será aberto para o pagamento. Feche para cancelar.
            </p>

            {error && (
              <div className={styles.muted} style={{ color: "#c33" }}>
                {error}
              </div>
            )}
            {loading && <div className={styles.muted}>A processar…</div>}

            {checkoutId ? (
              <iframe
                ref={iframeRef}
                title="SumUp Checkout"
                src={`/api/shop/sumup/widget?checkoutId=${encodeURIComponent(checkoutId)}`}
                style={{
                  width: "100%",
                  height: 520,
                  border: "1px solid #eaeaea",
                  borderRadius: 8,
                  marginTop: 12,
                }}
              />
            ) : (
              <div className={styles.muted}>A preparar o módulo de pagamento…</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
