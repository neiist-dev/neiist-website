"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef, type CSSProperties } from "react";
import styles from "@/styles/components/shop/OrderDetailsOverlay.module.css";
import { Order } from "@/types/shop/order";
import { OrderStatus } from "@/types/shop/orderStatus";
import { getOrderProgressSteps, getOrderKindFromItems } from "@/utils/shop/orderKindUtils";
import { getPaymentLabel } from "@/types/shop/payment";
import { getStatusLabel, getStatusCssClass, canTransitionTo } from "@/utils/shop/orderStatusUtils";
import { Product } from "@/types/shop/product";
import { MdClose } from "react-icons/md";
import { FaCheck, FaExclamationTriangle } from "react-icons/fa";
import { toast } from "sonner";
import { FiChevronDown, FiChevronUp, FiEdit2 } from "react-icons/fi";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import { getColorFromOptions, isColorKey } from "@/utils/shop/shopUtils";
import { FaArrowRightLong } from "react-icons/fa6";
import NewOrderModal from "./NewOrderModal";
import PosPaymentOverlay from "@/components/shop/PosPaymentOverlay";

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
  canEditNotes?: boolean;
  canEditItems?: boolean;
  products?: Product[];
}

export default function OrderDetailOverlay({
  orderId,
  orders,
  canManage = false,
  basePath,
  canEditNotes = false,
  canEditItems = false,
  products = [],
}: OrderDetailOverlayProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUserCancelConfirm, setShowUserCancelConfirm] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const [notesEditing, setNotesEditing] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [showPaymentOverlay, setShowPaymentOverlay] = useState(false);

  useEffect(() => {
    setOrder(orders.find((o) => o.id === orderId) || null);
  }, [orderId, orders]);

  useEffect(() => {
    setNotesDraft(order?.notes ?? "");
    if (order?.notes && String(order.notes).trim() !== "") {
      setNotesOpen(true);
    } else {
      setNotesOpen(false);
    }
  }, [order?.notes]);

  const deadlineToastShownRef = useRef(false);
  const isDeadlineNear = (() => {
    if (!order?.pickup_deadline) return false;
    try {
      const dl = new Date(order.pickup_deadline);
      const now = new Date();
      const diffDays = (dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 28 && diffDays >= 0;
    } catch {
      return false;
    }
  })();

  const showDeadlineToast = useCallback(() => {
    if (!order?.pickup_deadline) return;
    if (deadlineToastShownRef.current) return;
    const formatted = new Date(order.pickup_deadline).toLocaleDateString("pt-PT");
    const toastId = `pickup-deadline-${order.id}`;
    toast.warning(`Prazo limite de levantamento: ${formatted}`, {
      id: toastId,
      duration: Infinity,
      closeButton: true,
      dismissible: true,
      style: {
        color: "red",
        border: "2px solid var(--danger-colour, red)",
      },
    });
    deadlineToastShownRef.current = true;
  }, [order]);

  useEffect(() => {
    deadlineToastShownRef.current = false;
  }, [order?.id]);

  useEffect(() => {
    if (!order) return;
    if (!canManage && isDeadlineNear) showDeadlineToast();
  }, [order, canManage, isDeadlineNear, showDeadlineToast]);

  const handleCloseImmediate = useCallback(() => {
    router.push(basePath);
  }, [router, basePath]);

  const attemptClose = useCallback(() => {
    if (!order) {
      handleCloseImmediate();
      return;
    }
    const currentNotes = order.notes ?? "";
    if ((notesDraft ?? "") !== currentNotes && notesEditing) {
      setShowSaveConfirm(true);
      return;
    }
    handleCloseImmediate();
  }, [order, notesEditing, notesDraft, handleCloseImmediate]);

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
      // TODO: (SUCCESS)
    } else {
      // TODO: (ERROR)
      setError("Erro ao atualizar estado.");
    }
  };

  const handleUserCancel = async () => {
    if (!order) return;
    setError(null);
    const res = await fetch(`/api/shop/orders/${order.id}`, { method: "DELETE" });
    if (res.ok) {
      const updated = await res.json();
      setOrder(updated);
      router.refresh();
      // TODO: (SUCCESS)
    } else {
      // TODO: (ERROR)
      setError("Erro ao cancelar encomenda.");
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) attemptClose();
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !showEditOrderModal && !showPaymentOverlay) {
        if (notesEditing) {
          setShowSaveConfirm(true);
          return;
        }
        handleCloseImmediate();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleCloseImmediate, notesEditing, showEditOrderModal, showPaymentOverlay]);

  if (!order) {
    return (
      <div className={styles.backdrop}>
        <div className={styles.modal}>
          <div style={{ textAlign: "center", padding: "2rem" }}>Encomenda não encontrada.</div>
        </div>
      </div>
    );
  }

  const { orderKind } = getOrderKindFromItems(order.items);
  const progressSteps = getOrderProgressSteps(orderKind);
  const activeStepIndex = progressSteps.findLastIndex((step) =>
    step.activeStatuses.includes(order.status)
  );
  const progressWidth =
    progressSteps.length > 0 && activeStepIndex >= 0
      ? `${((activeStepIndex + 1) / progressSteps.length) * 100}%`
      : "0%";
  const progressBarStyle: CSSProperties = {
    "--progress-width": progressWidth,
  } as CSSProperties;

  const canSetPaid = canManage && canTransitionTo(order.status, "paid");
  const canSetReady = canManage && canTransitionTo(order.status, "ready");
  const canSetDelivered = canManage && canTransitionTo(order.status, "delivered");
  const canCancel = canManage && canTransitionTo(order.status, "cancelled");
  const userCanCancel = !canManage && order.status === "pending";

  const saveNotes = async (): Promise<boolean> => {
    if (!order) return false;
    if ((order.notes ?? "") === (notesDraft ?? "")) {
      setNotesEditing(false);
      return true;
    }
    setError(null);
    try {
      const res = await fetch(`/api/shop/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesDraft }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrder(updated);
        setNotesEditing(false);
        router.refresh();
        // TODO: (SUCCESS) show success toast after the order notes are saved.
        return true;
      } else {
        const err = await res.json().catch(() => null);
        // TODO: (ERROR)
        setError(err?.error ?? "Erro ao guardar notas.");
        return false;
      }
    } catch (err) {
      // TODO: (ERROR)
      setError("Erro ao guardar notas.");
      console.error(err);
      return false;
    }
  };

  return (
    <>
      {!showEditOrderModal && (
        <div className={styles.backdrop} onClick={handleBackdropClick}>
          <div className={styles.modal}>
            <button
              className={styles.closeButton}
              onClick={() => {
                attemptClose();
              }}
              aria-label="Fechar">
              <MdClose size={20} />
            </button>

            <div className={styles.header}>
              <h2>Encomenda</h2>
              <span className={`${styles.statusBadge} ${styles[getStatusCssClass(order.status)]}`}>
                {getStatusLabel(order.status)}
              </span>
            </div>

            <div className={styles.orderNumber}>
              {order.payment_reference ? order.payment_reference : order.order_number}
              <FaArrowRightLong />
              {order.payment_method ? getPaymentLabel(order.payment_method) : ""}
            </div>

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
                    {order.campus
                      ? order.campus.charAt(0).toUpperCase() + order.campus.slice(1)
                      : "-"}
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
              <div className={styles.sectionHeader}>
                <h3>Itens da Encomenda</h3>
                {canEditItems && (
                  <button
                    type="button"
                    className={styles.editItemsButton}
                    onClick={() => setShowEditOrderModal(true)}
                    title="Editar itens da encomenda"
                    aria-label="Editar itens da encomenda">
                    <FiEdit2 size={16} />
                  </button>
                )}
              </div>
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

            <div className={styles.section}>
              <details
                className={styles.notesDetails}
                onToggle={(e) => setNotesOpen((e.currentTarget as HTMLDetailsElement).open)}
                open={notesOpen}>
                <summary className={styles.notesSummary}>
                  <span>Notas</span>
                  <span className={styles.notesChevron}>
                    {notesOpen ? <FiChevronUp /> : <FiChevronDown />}
                  </span>
                </summary>

                <div className={styles.notesText}>
                  {canEditNotes ? (
                    notesEditing ? (
                      <textarea
                        autoFocus
                        className={styles.notesInput}
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        onBlur={() => {
                          const currentNotes = order.notes ?? "";
                          if ((notesDraft ?? "") !== currentNotes) setShowSaveConfirm(true);
                          else setNotesEditing(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            e.preventDefault();
                            e.stopPropagation();
                            const currentNotes = order.notes ?? "";
                            if ((notesDraft ?? "") !== currentNotes) setShowSaveConfirm(true);
                            else setNotesEditing(false);
                          }
                        }}
                      />
                    ) : (
                      <div
                        onClick={() => setNotesEditing(true)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setNotesEditing(true);
                          }
                        }}>
                        {order.notes ? order.notes : "Adicionar notas"}
                      </div>
                    )
                  ) : (
                    <div>{order.notes ? order.notes : "Adicionar notas"}</div>
                  )}
                </div>
              </details>
            </div>

            {canManage ? (
              <div className={styles.section}>
                <h3>Estado</h3>
                <div className={styles.actionButtons}>
                  <button
                    className={styles.buttonOutline}
                    onClick={() => setShowPaymentOverlay(true)}
                    disabled={!canSetPaid}>
                    Pagar
                  </button>
                  <button
                    className={styles.buttonPrimary}
                    onClick={() => setPendingStatus("ready")}
                    disabled={!canSetReady}>
                    Marcar como Pronto
                  </button>
                  <button
                    className={styles.buttonPrimary}
                    onClick={() => setPendingStatus("delivered")}
                    disabled={!canSetDelivered}>
                    Marcar como Entregue
                  </button>
                  <button
                    className={styles.buttonOutline}
                    onClick={() => setPendingStatus("cancelled")}
                    disabled={!canCancel}>
                    Cancelar Encomenda
                  </button>
                </div>
                <p className={styles.timestamp}>
                  Criada por {order.created_by || "-"} em{" "}
                  {new Date(order.created_at).toLocaleString("pt-PT")}
                </p>
                {order.paid_at && (
                  <p className={styles.timestamp}>
                    Pagamento verificado por {order.payment_checked_by} em{" "}
                    {new Date(order.paid_at).toLocaleString("pt-PT")}
                  </p>
                )}
                {order.pickup_deadline && (
                  <p className={styles.timestamp}>
                    Prazo limite para levantamento em{" "}
                    {new Date(order.pickup_deadline).toLocaleString("pt-PT")}
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
                    <ul className={styles.progressbar} style={progressBarStyle}>
                      {progressSteps.map((step, index) => {
                        const isStepActive = step.activeStatuses.includes(order.status);
                        const isStepAlert = step.key === "ready" && isDeadlineNear && isStepActive;

                        return (
                          <li
                            key={step.key}
                            className={`${styles.step0} ${isStepActive ? styles.active : ""} ${isStepAlert ? styles.stepAlert : ""}`}
                            id={`step${index + 1}`}>
                            <span className={styles.stepIcon}>
                              {isStepActive &&
                                (isStepAlert ? (
                                  <FaExclamationTriangle size={14} />
                                ) : (
                                  <FaCheck size={14} />
                                ))}
                            </span>
                            {step.label}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                <div className={styles.footer}>
                  {userCanCancel && (
                    <button
                      className={styles.cancelButton}
                      onClick={() => setShowUserCancelConfirm(true)}>
                      Cancelar Encomenda
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
          {pendingStatus && (
            <ConfirmDialog
              open={!!pendingStatus}
              message={
                pendingStatus === "cancelled"
                  ? "Tem a certeza que quer cancelar esta encomenda?"
                  : `Tem a certeza que quer marcar como ${getStatusLabel(pendingStatus)}?`
              }
              onConfirm={async () => {
                await handleStatusChange(pendingStatus);
                setPendingStatus(null);
              }}
              onCancel={() => setPendingStatus(null)}
            />
          )}
          <ConfirmDialog
            open={showUserCancelConfirm}
            message="Tem a certeza que quer cancelar esta encomenda?"
            onConfirm={async () => {
              setShowUserCancelConfirm(false);
              await handleUserCancel();
            }}
            onCancel={() => setShowUserCancelConfirm(false)}
          />
          <ConfirmDialog
            open={showSaveConfirm}
            message="As notas foram alteradas. Deseja guardar as alterações?"
            onConfirm={async () => {
              setShowSaveConfirm(false);
              const ok = await saveNotes();
              if (!ok) setNotesEditing(true);
            }}
            onCancel={() => {
              setShowSaveConfirm(false);
              setNotesDraft(order.notes ?? "");
              setNotesEditing(false);
            }}
          />

          {/* TODO: replace this inline error with a toast and remove this fallback once Sonner is implemented here. */}
          {error && <div className={styles.error}>{error}</div>}
        </div>
      )}

      {showEditOrderModal && canEditItems && (
        <NewOrderModal
          mode="edit"
          orderToEdit={order}
          products={products}
          onClose={() => setShowEditOrderModal(false)}
          onSubmit={(updatedOrder) => {
            if (updatedOrder) setOrder(updatedOrder);
            setShowEditOrderModal(false);
            router.refresh();
          }}
        />
      )}

      {showPaymentOverlay && (
        <PosPaymentOverlay
          open={showPaymentOverlay}
          order={order}
          reopenOrderUrl={`${basePath}?orderId=${order.id}`}
          onCloseAction={() => setShowPaymentOverlay(false)}
          onOrderUpdatedAction={(updatedOrder) => {
            setOrder(updatedOrder);
            setShowPaymentOverlay(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
