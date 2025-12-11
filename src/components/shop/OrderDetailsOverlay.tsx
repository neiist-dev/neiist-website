"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import styles from "@/styles/components/shop/OrderDetailsOverlay.module.css";
import {
  Order,
  OrderStatus,
  getStatusLabel,
  getStatusCssClass,
  canTransitionTo,
} from "@/types/shop";
import { MdClose } from "react-icons/md";
import { FaCheck } from "react-icons/fa";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import { getColorFromOptions, isColorKey } from "@/utils/shopUtils";

function formatVariant(options?: Record<string, string>, label?: string) {
  if (label) return label;
  if (!options) return "-";
  return Object.entries(options)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
}

interface OrderDetailOverlayProps {
  orderId: number;
  orders: Order[];
  canManage?: boolean;
  basePath: string;
}

export default function OrderDetailOverlay({
  orderId,
  orders,
  canManage = false,
  basePath,
}: OrderDetailOverlayProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOrder(orders.find((o) => o.id === orderId) || null);
  }, [orderId, orders]);

  const handleClose = useCallback(() => {
    router.push(basePath);
  }, [router, basePath]);

  const handleStatusChange = async (status: OrderStatus) => {
    if (!order) return;
    setError(null);
    const res = await fetch(`/api/shop/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOrder(updated);
      router.refresh();
    } else setError("Erro ao atualizar estado.");
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleClose]);

  if (!order) {
    return (
      <div className={styles.backdrop}>
        <div className={styles.modal}>
          <div style={{ textAlign: "center", padding: "2rem" }}>Encomenda não encontrada.</div>
        </div>
      </div>
    );
  }

  const steps = ["pending", "paid", "ready", "delivered"];
  const currentStepIndex = Math.max(0, steps.indexOf(order.status));

  const canSetPaid = canManage && canTransitionTo(order.status, "paid");
  const canSetReady = canManage && canTransitionTo(order.status, "ready");
  const canSetDelivered = canManage && canTransitionTo(order.status, "delivered");
  const canCancel = canManage && canTransitionTo(order.status, "cancelled");
  const userCanCancel = !canManage && order.status === "pending";

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={handleClose} aria-label="Fechar">
          <MdClose size={20} />
        </button>

        <div className={styles.header}>
          <h2>Encomenda</h2>
          <span className={`${styles.statusBadge} ${styles[getStatusCssClass(order.status)]}`}>
            {getStatusLabel(order.status)}
          </span>
        </div>

        <div className={styles.orderNumber}>#{order.order_number}</div>

        <div className={styles.infoGrid}>
          <div className={styles.infoColumn}>
            <div className={styles.infoItem}>
              <label>Nome</label>
              <p>{order.customer_name}</p>
            </div>
          </div>
          <div className={styles.infoColumn}>
            <div className={styles.infoItem}>
              <label>IST ID</label>
              <p>{order.user_istid}</p>
            </div>
          </div>
          <div className={styles.infoColumn}>
            <div className={styles.infoItem}>
              <label>Campus</label>
              <p>
                {order.campus ? order.campus.charAt(0).toUpperCase() + order.campus.slice(1) : "-"}
              </p>
            </div>
          </div>

          <div className={styles.infoColumnWide}>
            <div className={styles.infoItem}>
              <label>Email</label>
              <p>{order.customer_email}</p>
            </div>
          </div>
          <div className={styles.infoColumn}>
            <div className={styles.infoItem}>
              <label>Telefone</label>
              <p>{order.customer_phone || "-"}</p>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3>Itens da Encomenda</h3>
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span>Produto</span>
              <span>Variante</span>
              <span>Qtd</span>
              <span>Preço</span>
              <span>Total</span>
            </div>
            {order.items.map((item, idx) => {
              const colorInfo = getColorFromOptions(
                item.variant_options ?? undefined,
                item.variant_label ?? undefined
              );

              const nonColorParts: string[] = (() => {
                if (item.variant_options && Object.keys(item.variant_options).length > 0) {
                  return Object.entries(item.variant_options)
                    .filter(([k]) => !isColorKey(k))
                    .map(([k, v]) => `${k.trim()}: ${v}`);
                }
                if (item.variant_label) {
                  const parts = item.variant_label
                    .split(/\||,/)
                    .map((p) => p.trim())
                    .filter(Boolean);
                  return parts.filter((part) => {
                    const [k] = part.split(":");
                    return !isColorKey(k);
                  });
                }
                return [];
              })();
              const variantTextFallback =
                nonColorParts.length > 0
                  ? nonColorParts.join(", ")
                  : formatVariant(
                      item.variant_options ?? undefined,
                      item.variant_label ?? undefined
                    );
              return (
                <div key={idx} className={styles.tableRow}>
                  <span>{item.product_name}</span>
                  <span>
                    {colorInfo.hex ? (
                      <>
                        <span
                          style={{
                            display: "inline-block",
                            width: 14,
                            height: 14,
                            borderRadius: 14,
                            backgroundColor: colorInfo.hex,
                            marginRight: 8,
                            verticalAlign: "middle",
                          }}
                          title={colorInfo.name || colorInfo.hex}
                        />
                        {variantTextFallback}
                      </>
                    ) : (
                      variantTextFallback
                    )}
                  </span>
                  <span>{item.quantity}</span>
                  <span>{item.unit_price.toFixed(2)}€</span>
                  <span>{(item.unit_price * item.quantity).toFixed(2)}€</span>
                </div>
              );
            })}
          </div>
          <div className={styles.totalRow}>Total: {order.total_amount.toFixed(2)}€</div>
        </div>

        {canManage ? (
          <div className={styles.section}>
            <h3>Estado</h3>
            <div className={styles.actionButtons}>
              <button
                className={styles.buttonOutline}
                onClick={() => handleStatusChange("paid")}
                disabled={!canSetPaid}>
                Marcar como Pago
              </button>
              <button
                className={styles.buttonPrimary}
                onClick={() => handleStatusChange("ready")}
                disabled={!canSetReady}>
                Marcar como Pronto
              </button>
              <button
                className={styles.buttonPrimary}
                onClick={() => handleStatusChange("delivered")}
                disabled={!canSetDelivered}>
                Marcar como Entregue
              </button>
              <button
                className={styles.buttonOutline}
                onClick={() => setShowCancelConfirm(true)}
                disabled={!canCancel}>
                Cancelar Encomenda
              </button>
            </div>
            <p className={styles.timestamp}>
              Criada em {new Date(order.created_at).toLocaleString("pt-PT")}
            </p>
            {order.paid_at && (
              <p className={styles.timestamp}>
                Pagamento verificado por {order.payment_checked_by} em{" "}
                {new Date(order.paid_at).toLocaleString("pt-PT")}
              </p>
            )}
            {order.delivered_at && (
              <p className={styles.timestamp}>
                Entregue por {order.delivered_by} em{" "}
                {new Date(order.delivered_at).toLocaleString("pt-PT")}
              </p>
            )}
          </div>
        ) : (
          <>
            {order.status !== "cancelled" && (
              <div className={styles.progressContainer}>
                <ul className={styles.progressbar}>
                  <li
                    className={`${styles.step0} ${currentStepIndex >= 0 ? styles.active : ""}`}
                    id="step1">
                    <span className={styles.stepIcon}>
                      {currentStepIndex >= 0 && <FaCheck size={14} />}
                    </span>
                    Pendente
                  </li>
                  <li
                    className={`${styles.step0} ${currentStepIndex >= 1 ? styles.active : ""}`}
                    id="step2">
                    <span className={styles.stepIcon}>
                      {currentStepIndex >= 1 && <FaCheck size={14} />}
                    </span>
                    Pago
                  </li>
                  <li
                    className={`${styles.step0} ${currentStepIndex >= 2 ? styles.active : ""}`}
                    id="step3">
                    <span className={styles.stepIcon}>
                      {currentStepIndex >= 2 && <FaCheck size={14} />}
                    </span>
                    Pronto
                  </li>
                  <li
                    className={`${styles.step0} ${currentStepIndex >= 3 ? styles.active : ""}`}
                    id="step4">
                    <span className={styles.stepIcon}>
                      {currentStepIndex >= 3 && <FaCheck size={14} />}
                    </span>
                    Entregue
                  </li>
                </ul>
              </div>
            )}
            <div className={styles.footer}>
              {userCanCancel && (
                <button className={styles.cancelButton} onClick={() => setShowCancelConfirm(true)}>
                  Cancelar Encomenda
                </button>
              )}
            </div>
          </>
        )}
      </div>
      {showCancelConfirm && (
        <ConfirmDialog
          open={showCancelConfirm}
          message="Tem a certeza que quer cancelar esta encomenda?"
          onConfirm={async () => {
            await handleStatusChange("cancelled");
            setShowCancelConfirm(false);
          }}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
