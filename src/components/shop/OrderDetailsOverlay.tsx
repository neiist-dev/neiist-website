"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef, useMemo, type CSSProperties } from "react";
import styles from "@/styles/components/shop/OrderDetailsOverlay.module.css";
import { Order } from "@/types/shop/order";
import { OrderStatus } from "@/types/shop/orderStatus";
import {
  getAllowedOrderStatusTransitions,
  getOrderProgressSteps,
  getOrderKindFromItems,
  getOrderStatusLabelForKind,
  canTransitionOrderStatus,
  getOrderStepLabelFromDict,
} from "@/utils/shop/orderKindUtils";
import { getPaymentLabel } from "@/types/shop/payment";
import { getStatusLabel, getStatusCssClass } from "@/utils/shop/orderStatusUtils";
import { Product } from "@/types/shop/product";
import { MdClose } from "react-icons/md";
import { FaCheck, FaExclamationTriangle } from "react-icons/fa";
import { toast } from "sonner";
import { FiChevronDown, FiChevronUp, FiEdit2 } from "react-icons/fi";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import { getColorFromOptions, formatVariantSimple } from "@/utils/shop/shopUtils";
import { FaArrowRightLong } from "react-icons/fa6";
import NewOrderModal from "./NewOrderModal";
import PosPaymentOverlay from "@/components/shop/PosPaymentOverlay";
import { PENDING_PAYMENT_METHODS } from "@/types/shop/payment";
import type { OrderDetailsOverlayDict, PaymentLabelsDict, NewOrderModalDict } from "@/types/i18n";


function getPaymentDisplay(order: Order, dict: PaymentLabelsDict) {
  if (!order.payment_method) return "";

  const label = getPaymentLabel(order.payment_method, dict);
  return order.payment_method === "mbway" && order.mbway_number
    ? `${label} - ${order.mbway_number}`
    : label;
}

function hasPaymentReference(order: Order): boolean {
  if (!order.payment_method) return false;

  const methodsWithRef = ["sumup", "sumup-tpa", "other", "apple-pay"];
  return methodsWithRef.includes(order.payment_method) && !!order.payment_reference?.trim();
}

function getPaymentButtonLabel(paymentMethod: Order["payment_method"] | undefined, d: OrderDetailsOverlayDict["order_details"]): string {
  return paymentMethod && PENDING_PAYMENT_METHODS.has(paymentMethod)
    ? d.register_payment
    : d.finalize_order;
}

interface OrderDetailOverlayProps {
  orderId: number;
  orders: Order[];
  canManage?: boolean;
  basePath: string;
  canEditNotes?: boolean;
  canEditItems?: boolean;
  products?: Product[];
  dict: OrderDetailsOverlayDict;
}

export default function OrderDetailOverlay({
  orderId,
  orders,
  canManage = false,
  basePath,
  canEditNotes = false,
  canEditItems = false,
  products = [],
  dict,
}: OrderDetailOverlayProps) {
  const router = useRouter();
  const d = dict.order_details;
  const [order, setOrder] = useState<Order | null>(null);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [showUserCancelConfirm, setShowUserCancelConfirm] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const [notesEditing, setNotesEditing] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [showPaymentOverlay, setShowPaymentOverlay] = useState(false);

  const paymentButtonLabel = getPaymentButtonLabel(order?.payment_method, d);

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

  const isDeadlineNear = useMemo(() => {
    if (!order?.pickup_deadline) return false;
    const diffDays = (new Date(order.pickup_deadline).getTime() - Date.now()) / 86400000;
    return !isNaN(diffDays) && diffDays >= 0 && diffDays <= 28;
  }, [order?.pickup_deadline]);

  const showDeadlineToast = useCallback(() => {
    if (!order?.pickup_deadline) return;
    if (deadlineToastShownRef.current) return;
    const formatted = new Date(order.pickup_deadline).toLocaleDateString();
    const toastId = `pickup-deadline-${order.id}`;
    toast.warning(d.pickup_toast.replace("{date}", formatted), {
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
  }, [order, d.pickup_toast]);

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
    if (order && notesEditing && notesDraft !== (order.notes ?? "")) {
      setShowSaveConfirm(true);
    } else {
      handleCloseImmediate();
    }
  }, [order, notesEditing, notesDraft, handleCloseImmediate]);

  const handleCancelNotes = useCallback(() => {
    if (notesDraft !== (order?.notes ?? "")) setShowSaveConfirm(true);
    else setNotesEditing(false);
  }, [notesDraft, order?.notes]);

  const handleStatusChange = async (status: OrderStatus) => {
    if (!order) return;
    const res = await fetch(`/api/shop/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOrder(updated);
      router.refresh();
      toast.success(`Estado atualizado para ${getStatusLabel(status)}.`, { closeButton: true });
    } else {
      toast.error(d.error_update_status, { closeButton: true });
    }
  };

  const handleUserCancel = async () => {
    if (!order) return;
    const res = await fetch(`/api/shop/orders/${order.id}`, { method: "DELETE" });
    if (res.ok) {
      const updated = await res.json();
      setOrder(updated);
      router.refresh();
      toast.success("Encomenda cancelada com sucesso.", { closeButton: true });
    } else {
      toast.error(d.error_cancel, { closeButton: true });
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
          <div style={{ textAlign: "center", padding: "2rem" }}>{d.not_found}</div>
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

  const allowedStatusTransitions = canManage
    ? getAllowedOrderStatusTransitions(orderKind, order.status)
    : [];
  const canSetPaid = canManage && canTransitionOrderStatus(orderKind, order.status, "paid");
  const canSetReady = canManage && canTransitionOrderStatus(orderKind, order.status, "ready");
  const canSetDelivered =
    canManage && canTransitionOrderStatus(orderKind, order.status, "delivered");
  const canCancel = canManage && canTransitionOrderStatus(orderKind, order.status, "cancelled");
  const canShowManageStatusActions = allowedStatusTransitions.length > 0;
  const userCanCancel = !canManage && order.status === "pending";

  const saveNotes = async (): Promise<boolean> => {
    if (!order) return false;
    if ((order.notes ?? "") === notesDraft) {
      setNotesEditing(false);
      return true;
    }
    try {
      const res = await fetch(`/api/shop/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesDraft }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || d.error_save_notes);

      setOrder(data);
      setNotesEditing(false);
      router.refresh();
      toast.success(d.success_save_notes, { closeButton: true });
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : d.error_save_notes, {
        closeButton: true,
      });
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
              aria-label={d.close_label}>
              <MdClose size={20} />
            </button>

            <div className={styles.header}>
              <h2>{d.order_title}</h2>
              <span className={`${styles.statusBadge} ${styles[getStatusCssClass(order.status)]}`}>
                {getOrderStatusLabelForKind(orderKind, order.status, order)}
              </span>
            </div>

            <div className={styles.orderNumber}>
              {order.order_number}
              <FaArrowRightLong />
              {getPaymentDisplay(order, dict.pos_payment)}
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoColumn}>
                <div className={styles.infoItem}>
                  <label>{d.col_name}</label>
                  <p>{order.customer_name}</p>
                </div>
              </div>
              <div className={styles.infoColumn}>
                <div className={styles.infoItem}>
                  <label>{d.col_ist_id}</label>
                  <p>{order.user_istid}</p>
                </div>
              </div>
              <div className={styles.infoColumn}>
                <div className={styles.infoItem}>
                  <label>{d.col_campus}</label>
                  <p>
                    {order.campus
                      ? order.campus.charAt(0).toUpperCase() + order.campus.slice(1)
                      : "-"}
                  </p>
                </div>
              </div>

              <div className={styles.infoColumnWide}>
                <div className={styles.infoItem}>
                  <label>{d.col_email}</label>
                  <p>{order.customer_email}</p>
                </div>
              </div>
              <div className={styles.infoColumn}>
                <div className={styles.infoItem}>
                  <label>{d.col_phone}</label>
                  <p>{order.customer_phone || "-"}</p>
                </div>
              </div>
              {hasPaymentReference(order) && (
                <div className={styles.infoColumn}>
                  <div className={styles.infoItemInline}>
                    <label>{d.payment_reference_label}</label>
                    <p>{order.payment_reference?.trim()}</p>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3>{d.items_title}</h3>
                {canEditItems && (
                  <button
                    type="button"
                    className={styles.editItemsButton}
                    onClick={() => setShowEditOrderModal(true)}
                    title={d.edit_items_label}
                    aria-label={d.edit_items_label}>
                    <FiEdit2 size={16} />
                  </button>
                )}
              </div>
              <div className={styles.table}>
                <div className={styles.tableHeader}>
                  <span>{d.col_product}</span>
                  <span>{d.col_variant}</span>
                  <span>{d.col_qty}</span>
                  <span>{d.col_price}</span>
                  <span>{d.col_total}</span>
                </div>
                {order.items.map((item, idx) => {
                  const colorInfo = getColorFromOptions(
                    item.variant_options ?? undefined,
                    item.variant_label ?? undefined
                  );

                  const variantTextFallback =
                    formatVariantSimple(
                      item.variant_options ?? undefined,
                      item.variant_label ?? undefined
                    ).text || "-";
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
                {order.discount_amount != null && Number(order.discount_amount) > 0 && (
                  <div className={styles.tableRow}>
                    <span>Desconto</span>
                    <span>{order.discount_code}</span>
                    <span>1</span>
                    <span>-{order.discount_amount.toFixed(2)}€</span>
                    <span>-{order.discount_amount.toFixed(2)}€</span>
                  </div>
                )}
              </div>
              <div className={styles.totalRow}>{d.total_label.replace("{amount}", order.total_amount.toFixed(2))}</div>
            </div>

            <div className={styles.section}>
              <details
                className={styles.notesDetails}
                onToggle={(e) => setNotesOpen((e.currentTarget as HTMLDetailsElement).open)}
                open={notesOpen}>
                <summary className={styles.notesSummary}>
                  <span>{d.notes_title}</span>
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
                        onBlur={handleCancelNotes}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCancelNotes();
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
                        {order.notes ? order.notes : d.add_notes}
                      </div>
                    )
                  ) : (
                    <div>{order.notes ? order.notes : d.add_notes}</div>
                  )}
                </div>
              </details>
            </div>

            {canManage ? (
              <div className={styles.section}>
                {canShowManageStatusActions && (
                  <>
                    <h3>{d.status_title}</h3>
                    <div className={styles.actionButtons}>
                      {canSetPaid && (
                        <button
                          className={styles.buttonPrimary}
                          onClick={() => setShowPaymentOverlay(true)}>
                          {paymentButtonLabel}
                        </button>
                      )}

                      {canSetReady && (
                        <button
                          className={styles.buttonPrimary}
                          onClick={() => setPendingStatus("ready")}>
                          {d.mark_ready}
                        </button>
                      )}

                      {canSetDelivered && (
                        <button
                          className={styles.buttonPrimary}
                          onClick={() => setPendingStatus("delivered")}>
                          {d.mark_delivered}
                        </button>
                      )}

                      {canCancel && (
                        <button
                          className={styles.buttonOutline}
                          onClick={() => setPendingStatus("cancelled")}>
                          {d.cancel_order}
                        </button>
                      )}
                    </div>
                  </>
                )}
                <p className={styles.timestamp}>
                  {d.created_by
                    .replace("{by}", order.created_by || "-")
                    .replace("{date}", new Date(order.created_at).toLocaleString())}
                </p>
                {order.paid_at && (
                  <p className={styles.timestamp}>
                    {d.payment_verified_by
                      .replace("{by}", order.payment_checked_by ?? "")
                      .replace("{date}", new Date(order.paid_at).toLocaleString())}
                  </p>
                )}
                {order.pickup_deadline && (
                  <p className={styles.timestamp}>
                    {d.pickup_deadline.replace("{date}", new Date(order.pickup_deadline).toLocaleString())}
                  </p>
                )}
                {order.delivered_at && (
                  <p className={styles.timestamp}>
                    {d.delivered_by
                      .replace("{by}", order.delivered_by ?? "")
                      .replace("{date}", new Date(order.delivered_at).toLocaleString())}
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
                        
                        const translatedLabel = getOrderStepLabelFromDict(step, d);

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
                            {translatedLabel}
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
                      {d.cancel_order}
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
                  ? d.confirm_cancel
                  : d.confirm_status.replace("{status}", getStatusLabel(pendingStatus))
              }
              onConfirm={async () => {
                await handleStatusChange(pendingStatus);
                setPendingStatus(null);
              }}
              onCancel={() => setPendingStatus(null)}
              dict={dict.confirm_dialog}
            />
          )}
          <ConfirmDialog
            open={showUserCancelConfirm}
            message={d.confirm_cancel}
            onConfirm={async () => {
              setShowUserCancelConfirm(false);
              await handleUserCancel();
            }}
            onCancel={() => setShowUserCancelConfirm(false)}
            dict={dict.confirm_dialog}
          />
          <ConfirmDialog
            open={showSaveConfirm}
            message={d.confirm_save_notes}
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
            dict={dict.confirm_dialog}
          />
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
          dict={dict as NewOrderModalDict}
        />
      )}

      {showPaymentOverlay && (
        <PosPaymentOverlay
          open={showPaymentOverlay}
          order={order}
          initialPaymentMethod={order.payment_method}
          reopenOrderUrl={`${basePath}?orderId=${order.id}`}
          onCloseAction={() => setShowPaymentOverlay(false)}
          onOrderUpdatedAction={(updatedOrder) => {
            setOrder(updatedOrder);
            setShowPaymentOverlay(false);
            router.refresh();
          }}
          dict={{
            pos_payment: dict.pos_payment,
            confirm_dialog: dict.confirm_dialog,
          } as Parameters<typeof PosPaymentOverlay>[0]["dict"]}
        />
      )}
    </>
  );
}
