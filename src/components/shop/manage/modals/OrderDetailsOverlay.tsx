"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef, useMemo, type CSSProperties } from "react";
import { Alert, Badge, Button, Heading, Modal, Table, Text } from "@neiist/ui";
import styles from "@/styles/components/shop/manage/modals/OrderDetailsOverlay.module.css";
import { Order } from "@/types/shop/order";
import { OrderStatus } from "@/types/shop/orderStatus";
import {
  getLocalizedOrderStatusLabel,
  getStatusLabel,
  canTransitionOrderStatus,
  isTicketOrder,
  isTicketOrderItem,
} from "@/utils/shop/orderStatusUtils";
import { FaCalendarAlt, FaCheck, FaExclamationTriangle } from "react-icons/fa";
import { FiChevronDown, FiChevronUp, FiMail, FiRefreshCw } from "react-icons/fi";
import { getColorFromOptions, formatVariantSimple, getPaymentLabel } from "@/utils/shop/shopUtils";
import { getCampusSchedule } from "@/types/schedule";
import { FaArrowRightLong } from "react-icons/fa6";
import { LuTicket, LuClock, LuCircleCheck, LuCalendar, LuTruck } from "react-icons/lu";
import CampusScheduleOverlay from "./CampusScheduleOverlay";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  setOrderItemStatusAction,
  setOrderStatusAction,
  updateOrderAction,
  cancelOrderAction,
  resendOrderEmailAction,
  retryOrderEventHookAction,
} from "@/actions/shop/orders";

function getStatusBadgeVariant(
  status: string
): "primary" | "secondary" | "tertiary" | "quaternary" | "outline" | "danger" {
  switch (status) {
    case "paid":
    case "completed":
    case "delivered":
      return "primary";
    case "ready":
      return "secondary";
    case "pending":
    case "processing":
      return "tertiary";
    case "cancelled":
    case "failed":
      return "danger";
    default:
      return "outline";
  }
}

function getPaymentDisplay(order: Order, dict: Dictionary["order_details"]) {
  if (!order.payment_method) return "";

  return getPaymentLabel(order.payment_method, dict.payment_methods);
}

function hasPaymentReference(order: Order): boolean {
  if (!order.payment_method) return false;

  const methodsWithRef = ["sumup", "sumup-tpa", "other", "apple-pay"];
  return methodsWithRef.includes(order.payment_method) && !!order.payment_reference?.trim();
}

function getPaymentButtonLabel(dict: Dictionary["order_details"], order?: Order | null): string {
  const isUnpaid = !order?.paid_at || order.status === "pending";
  return isUnpaid ? dict.register_payment : dict.finalize_order;
}

interface OrderDetailOverlayProps {
  order: Order | null;
  canManage?: boolean;
  canDeliver?: boolean;
  canOverride?: boolean;
  basePath: string;
  canEditNotes?: boolean;
  dict: Dictionary["order_details"];
}

export default function OrderDetailOverlay({
  order: initialOrder,
  canManage = false,
  canDeliver = false,
  canOverride = false,
  basePath,
  canEditNotes = false,
  dict,
}: OrderDetailOverlayProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(initialOrder);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [showUserCancelConfirm, setShowUserCancelConfirm] = useState(false);
  const [showPosRedirectModal, setShowPosRedirectModal] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const [notesEditing, setNotesEditing] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const [emailSending, setEmailSending] = useState(false);
  const [retryingHook, setRetryingHook] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);

  const paymentButtonLabel = getPaymentButtonLabel(dict, order);

  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

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
    Alert.warning(dict.pickup_toast.replace("{date}", formatted), {
      duration: Infinity,
    });
    deadlineToastShownRef.current = true;
  }, [order, dict.pickup_toast]);

  useEffect(() => {
    deadlineToastShownRef.current = false;
  }, [order?.order_number]);

  useEffect(() => {
    if (!order) return;
    if (!canManage && isDeadlineNear) showDeadlineToast();
  }, [order, canManage, isDeadlineNear, showDeadlineToast]);

  const handleCloseImmediate = useCallback(() => {
    router.push(basePath, { scroll: false });
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
    try {
      const updated = await setOrderStatusAction(order.order_number, status);
      setOrder(updated);
      router.refresh();
      Alert.success(dict.status_updated);
    } catch {
      Alert.error(dict.error_update_status);
    }
  };

  const handleUserCancel = async () => {
    if (!order) return;
    try {
      await cancelOrderAction(order.order_number);
      setOrder({ ...order, status: "cancelled" });
      router.refresh();
      Alert.success(dict.order_cancelled);
    } catch {
      Alert.error(dict.error_cancel);
    }
  };

  const locale = basePath.split("/")[1] || "pt";

  const handleRedirectToPos = () => {
    if (!order) return;
    setShowPosRedirectModal(false);
    router.push(`/${locale}/shop/pos?orderNumber=${encodeURIComponent(order.order_number)}`);
  };

  const handleResendEmail = async () => {
    if (!order) return;
    setEmailSending(true);
    try {
      const res = await resendOrderEmailAction(order.order_number);
      if (res.success) {
        Alert.success(dict.email_resent);
      } else {
        Alert.error(dict.error_resend_email);
      }
    } catch (err: unknown) {
      Alert.error(err instanceof Error ? err.message : dict.error_resend_email);
    } finally {
      setEmailSending(false);
    }
  };

  const handleRetryHook = async () => {
    if (!order) return;
    setRetryingHook(true);
    try {
      const res = await retryOrderEventHookAction(order.order_number);
      if (res.success) {
        Alert.success(dict.item_updated);
      } else {
        Alert.error(dict.error_item_update);
      }
    } catch (err: unknown) {
      Alert.error(err instanceof Error ? err.message : dict.error_item_update);
    } finally {
      setRetryingHook(false);
    }
  };

  const handleItemStatusChange = async (itemId: number, newStatus: OrderStatus) => {
    setUpdatingItemId(itemId);
    try {
      const res = await setOrderItemStatusAction(itemId, newStatus);
      if (res?.success) {
        setOrder((prev) => {
          if (!prev) return null;
          const updatedItems = prev.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  status: newStatus,
                  delivered_at:
                    newStatus === "delivered" ? new Date().toISOString() : item.delivered_at,
                }
              : item
          );
          const allDelivered =
            updatedItems.length > 0 && updatedItems.every((i) => i.status === "delivered");
          const allReadyOrDelivered =
            updatedItems.length > 0 &&
            updatedItems.every((i) => i.status === "ready" || i.status === "delivered");
          let nextOrderStatus = prev.status;
          if (allDelivered) {
            nextOrderStatus = "delivered";
          } else if (allReadyOrDelivered && prev.status === "paid") {
            nextOrderStatus = "ready";
          }
          return {
            ...prev,
            items: updatedItems,
            status: nextOrderStatus,
          };
        });
        router.refresh();
        Alert.success(dict.item_updated);
      }
    } catch {
      Alert.error(dict.error_item_update);
    } finally {
      setUpdatingItemId(null);
    }
  };

  if (!order) return null;

  const isTicket = isTicketOrder(order);
  const isCancelled = order.status === "cancelled";
  const isPaidOrBeyond = ["paid", "ready", "delivered"].includes(order.status);
  const hasEventHook = order.items.some((i) => !!i.event_hook);

  const physicalItems = order.items.filter((item) => !isTicketOrderItem(item));

  const undeliveredPhysicalItems = physicalItems.filter((item) => item.status !== "delivered");

  const hasTicketItems = isTicket;

  const showActionsColumn = canManage || canDeliver || hasTicketItems;

  const progressSteps: Array<{
    key: OrderStatus;
    activeStatuses: OrderStatus[];
  }> = isTicket
    ? [
        { key: "pending", activeStatuses: ["pending", "paid"] },
        { key: "paid", activeStatuses: ["paid"] },
      ]
    : [
        {
          key: "pending",
          activeStatuses: ["pending", "paid", "ready", "delivered"],
        },
        { key: "paid", activeStatuses: ["paid", "ready", "delivered"] },
        { key: "ready", activeStatuses: ["ready", "delivered"] },
        { key: "delivered", activeStatuses: ["delivered"] },
      ];

  const getStepLabel = (step: { key: OrderStatus }) => {
    if (isTicket && step.key === "paid") return dict.ticket_confirmed;
    if (step.key === "pending") return dict.step_pending;
    if (step.key === "paid") return dict.step_paid;
    if (step.key === "ready") return dict.step_ready;
    if (step.key === "delivered") return dict.step_delivered;
    return dict.status[step.key];
  };

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

  const canSetPaid = canManage && canTransitionOrderStatus(order.status, "paid", isTicket);
  const canSetReady =
    canManage && !isTicket && canTransitionOrderStatus(order.status, "ready", isTicket);
  const canSetDelivered =
    canManage &&
    !isTicket &&
    undeliveredPhysicalItems.length > 1 &&
    canTransitionOrderStatus(order.status, "delivered", isTicket);
  const canCancel =
    order.status !== "cancelled" &&
    (canManage || canOverride) &&
    (canTransitionOrderStatus(order.status, "cancelled", isTicket) || canOverride) &&
    (order.status === "pending" || canOverride);
  const userCanCancel = !canManage && !canOverride && order.status === "pending";

  const saveNotes = async (): Promise<boolean> => {
    if (!order) return false;
    if ((order.notes ?? "") === notesDraft) {
      setNotesEditing(false);
      return true;
    }
    try {
      const updated = await updateOrderAction(order.order_number, { notes: notesDraft });
      setOrder(updated);
      setNotesEditing(false);
      router.refresh();
      Alert.success(dict.success_save_notes);
      return true;
    } catch (err) {
      Alert.error(err instanceof Error ? err.message : dict.error_save_notes);
      return false;
    }
  };

  return (
    <>
      <Modal
        open={!!order}
        onClose={attemptClose}
        size="xl"
        title={dict.order_title}
        badge={
          <Badge variant={getStatusBadgeVariant(order.status)}>
            {getLocalizedOrderStatusLabel(order, {
              status: dict.status,
              ticket_confirmed: dict.ticket_confirmed,
            })}
          </Badge>
        }>
        <div className={styles.orderNumber}>
          {order.order_number}
          <FaArrowRightLong />
          {getPaymentDisplay(order, dict)}
        </div>

        <div className={styles.infoGrid}>
          <div className={styles.infoColumn}>
            <div className={styles.infoItem}>
              <Text size="sm" variant="muted">
                {dict.col_name}
              </Text>
              <Text size="md">{order.customer_name}</Text>
            </div>
          </div>
          <div className={styles.infoColumn}>
            <div className={styles.infoItem}>
              <Text size="sm" variant="muted">
                {dict.col_ist_id}
              </Text>
              <Text size="md">{order.user_istid}</Text>
            </div>
          </div>
          <div className={styles.infoColumn}>
            <div className={styles.infoItem}>
              <Text size="sm" variant="muted">
                {dict.col_campus}
              </Text>
              <div className={styles.campusWrapper}>
                <Text size="md">
                  {order.campus
                    ? order.campus.charAt(0).toUpperCase() + order.campus.slice(1)
                    : "-"}
                </Text>
                {order.campus && getCampusSchedule(order.campus) && (
                  <div className={styles.infoBubbleWrapper}>
                    <button
                      type="button"
                      className={styles.infoBubble}
                      onClick={() => setShowScheduleModal(true)}
                      aria-label={dict.col_campus}>
                      <FaCalendarAlt />
                    </button>
                    <div className={styles.tooltip}>{dict.col_campus}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.infoColumnWide}>
            <div className={styles.infoItem}>
              <Text size="sm" variant="muted">
                {dict.col_email}
              </Text>
              <Text size="md">{order.customer_email}</Text>
            </div>
          </div>
          <div className={styles.infoColumn}>
            <div className={styles.infoItem}>
              <Text size="sm" variant="muted">
                {dict.col_phone}
              </Text>
              <Text size="md">{order.customer_phone || "-"}</Text>
            </div>
          </div>
          {hasPaymentReference(order) && (
            <div className={styles.infoColumn}>
              <div className={styles.infoItemInline}>
                <Text size="sm" variant="muted">
                  {dict.payment_reference_label}
                </Text>
                <Text size="md">{order.payment_reference?.trim()}</Text>
              </div>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Heading level={4}>{dict.items_title}</Heading>
          </div>
          <div className={styles.tableWrapper}>
            <Table responsive="scroll">
              <Table.Head>
                <Table.Row>
                  <Table.HeaderCell>{dict.col_product}</Table.HeaderCell>
                  <Table.HeaderCell>{dict.col_variant}</Table.HeaderCell>
                  <Table.HeaderCell align="center">{dict.col_qty}</Table.HeaderCell>
                  <Table.HeaderCell align="center">{dict.col_status}</Table.HeaderCell>
                  <Table.HeaderCell align="right">{dict.col_price}</Table.HeaderCell>
                  <Table.HeaderCell align="right">{dict.col_total}</Table.HeaderCell>
                  {showActionsColumn && (
                    <Table.HeaderCell align="center">{dict.col_actions}</Table.HeaderCell>
                  )}
                </Table.Row>
              </Table.Head>
              <Table.Body>
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
                  const isItemTicket = isTicketOrderItem(item);
                  return (
                    <Table.Row
                      key={`${item.product_id}-${item.variant_id ?? item.variant_label ?? idx}`}>
                      <Table.Cell>
                        <strong>{item.product_name}</strong>
                      </Table.Cell>
                      <Table.Cell>
                        {colorInfo.hex ? (
                          <>
                            <span
                              className={styles.variantColorSwatch}
                              style={{ backgroundColor: colorInfo.hex }}
                              title={colorInfo.name || colorInfo.hex}
                            />
                            {variantTextFallback}
                          </>
                        ) : (
                          variantTextFallback
                        )}
                      </Table.Cell>
                      <Table.Cell align="center">{item.quantity}</Table.Cell>
                      <Table.Cell align="center">
                        <Badge
                          size="sm"
                          variant={getStatusBadgeVariant(item.status || order.status)}>
                          {getStatusLabel(
                            (item.status as OrderStatus) || order.status,
                            dict.status,
                            {
                              isTicket: isItemTicket,
                              ticketConfirmedLabel: dict.ticket_confirmed,
                            }
                          ) ??
                            item.status ??
                            dict.status[order.status]}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell align="right">{item.unit_price.toFixed(2)}€</Table.Cell>
                      <Table.Cell align="right">
                        {(item.unit_price * item.quantity).toFixed(2)}€
                      </Table.Cell>
                      {showActionsColumn && (
                        <Table.Cell align="center">
                          {isItemTicket ? (
                            item.event_id ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/${locale}/activities/${item.event_id}/ticket?from=my-tickets`
                                  );
                                }}>
                                <LuTicket size={14} />
                                {dict.view_ticket}
                              </Button>
                            ) : null
                          ) : (canManage || canDeliver) && item.id != null ? (
                            item.status === "paid" && canManage ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleItemStatusChange(item.id!, "ready")}
                                disabled={updatingItemId === item.id}>
                                {updatingItemId === item.id ? dict.saving : dict.mark_ready_short}
                              </Button>
                            ) : item.status === "ready" && (canDeliver || canManage) ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleItemStatusChange(item.id!, "delivered")}
                                disabled={updatingItemId === item.id}>
                                {updatingItemId === item.id ? dict.saving : dict.deliver}
                              </Button>
                            ) : null
                          ) : null}
                        </Table.Cell>
                      )}
                    </Table.Row>
                  );
                })}
                {order.discount_amount != null && Number(order.discount_amount) > 0 && (
                  <Table.Row>
                    <Table.Cell>
                      <em>{dict.discount_label}</em>
                    </Table.Cell>
                    <Table.Cell>{order.discount_code}</Table.Cell>
                    <Table.Cell align="center">1</Table.Cell>
                    <Table.Cell align="center">-</Table.Cell>
                    <Table.Cell align="right">-{order.discount_amount.toFixed(2)}€</Table.Cell>
                    <Table.Cell align="right">-{order.discount_amount.toFixed(2)}€</Table.Cell>
                    {showActionsColumn && <Table.Cell align="center">-</Table.Cell>}
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
          </div>
          <div className={styles.totalRow}>
            {dict.total_label.replace("{amount}", order.total_amount.toFixed(2))}
          </div>
        </div>

        <div className={styles.section}>
          <details
            className={styles.notesDetails}
            onToggle={(e) => setNotesOpen((e.currentTarget as HTMLDetailsElement).open)}
            open={notesOpen}>
            <summary className={styles.notesSummary}>
              <span>{dict.notes_title}</span>
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
                    {order.notes ? order.notes : dict.add_notes}
                  </div>
                )
              ) : (
                <div>{order.notes ? order.notes : dict.add_notes}</div>
              )}
            </div>
          </details>
        </div>

        {canManage && (
          <div className={styles.auditSection}>
            <div className={styles.auditGrid}>
              <div className={styles.auditItem}>
                <LuClock size={14} className={styles.auditIcon} />
                <span>
                  {dict.created_by
                    .replace("{by}", order.created_by || "-")
                    .replace("{date}", new Date(order.created_at).toLocaleString())}
                </span>
              </div>
              {order.paid_at && (
                <div className={styles.auditItem}>
                  <LuCircleCheck size={14} className={styles.auditIcon} />
                  <span>
                    {dict.payment_verified_by
                      .replace("{by}", order.payment_checked_by || "-")
                      .replace("{date}", new Date(order.paid_at).toLocaleString())}
                  </span>
                </div>
              )}
              {order.pickup_deadline && (
                <div className={styles.auditItem}>
                  <LuCalendar size={14} className={styles.auditIcon} />
                  <span>
                    {dict.pickup_deadline.replace(
                      "{date}",
                      new Date(order.pickup_deadline).toLocaleString()
                    )}
                  </span>
                </div>
              )}
              {order.delivered_at && (
                <div className={styles.auditItem}>
                  <LuTruck size={14} className={styles.auditIcon} />
                  <span>
                    {dict.delivered_by
                      .replace("{by}", order.delivered_by || "-")
                      .replace("{date}", new Date(order.delivered_at).toLocaleString())}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {canManage ? (
          <div className={styles.modalFooter}>
            <div className={styles.footerLeft}>
              {!isCancelled && isPaidOrBeyond && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleResendEmail}
                    disabled={emailSending}>
                    <FiMail className={styles.btnIcon} />
                    {emailSending ? dict.saving : dict.resend_email}
                  </Button>

                  {hasEventHook && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRetryHook}
                      disabled={retryingHook}>
                      <FiRefreshCw className={styles.btnIcon} />
                      {retryingHook ? dict.saving : "Reprocessar Inscrição"}
                    </Button>
                  )}
                </>
              )}
            </div>

            <div className={styles.footerRight}>
              {canCancel && (
                <Button
                  size="sm"
                  variant="outline"
                  color="danger"
                  onClick={() => setPendingStatus("cancelled")}>
                  {dict.cancel_order}
                </Button>
              )}

              {order.status === "pending"
                ? canSetPaid && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setShowPosRedirectModal(true)}>
                      {dict.pay_in_pos}
                    </Button>
                  )
                : canSetPaid && (
                    <Button size="sm" variant="primary" onClick={() => setPendingStatus("paid")}>
                      {paymentButtonLabel}
                    </Button>
                  )}

              {canSetReady && (
                <Button size="sm" variant="primary" onClick={() => setPendingStatus("ready")}>
                  {dict.mark_ready}
                </Button>
              )}

              {canSetDelivered && (
                <Button size="sm" variant="primary" onClick={() => setPendingStatus("delivered")}>
                  {dict.mark_delivered}
                </Button>
              )}
            </div>
          </div>
        ) : canDeliver && canSetDelivered ? (
          <div className={styles.modalFooter}>
            <div className={styles.footerRight}>
              <Button size="sm" variant="primary" onClick={() => setPendingStatus("delivered")}>
                {dict.mark_delivered}
              </Button>
            </div>
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
                        {getStepLabel(step)}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <div className={styles.footer}>
              {userCanCancel && (
                <Button
                  size="sm"
                  variant="outline"
                  color="danger"
                  onClick={() => setShowUserCancelConfirm(true)}>
                  {dict.cancel_order}
                </Button>
              )}
            </div>
          </>
        )}
      </Modal>

      {pendingStatus && (
        <Modal
          open={!!pendingStatus}
          onClose={() => setPendingStatus(null)}
          size="sm"
          title={
            pendingStatus === "cancelled"
              ? dict.cancel_order
              : dict.confirm_status.replace(
                  "{status}",
                  getStatusLabel(pendingStatus, dict.status, {
                    isTicket,
                    ticketConfirmedLabel: dict.ticket_confirmed,
                  })
                )
          }>
          <div className={styles.modalBody}>
            <Text size="sm" className={styles.modalText}>
              {pendingStatus === "cancelled"
                ? dict.confirm_cancel
                : dict.confirm_status.replace(
                    "{status}",
                    getStatusLabel(pendingStatus, dict.status, {
                      isTicket,
                      ticketConfirmedLabel: dict.ticket_confirmed,
                    })
                  )}
            </Text>
            <div className={styles.modalActions}>
              <Button size="sm" variant="outline" onClick={() => setPendingStatus(null)}>
                {dict.back}
              </Button>
              <Button
                size="sm"
                variant={pendingStatus === "cancelled" ? "danger" : "primary"}
                onClick={async () => {
                  const statusToChange = pendingStatus;
                  setPendingStatus(null);
                  await handleStatusChange(statusToChange);
                }}>
                {dict.confirm}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <Modal
        open={showUserCancelConfirm}
        onClose={() => setShowUserCancelConfirm(false)}
        size="sm"
        title={dict.cancel_order}>
        <div className={styles.modalBody}>
          <Text size="sm" className={styles.modalText}>
            {dict.confirm_cancel}
          </Text>
          <div className={styles.modalActions}>
            <Button size="sm" variant="outline" onClick={() => setShowUserCancelConfirm(false)}>
              {dict.back}
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={async () => {
                setShowUserCancelConfirm(false);
                await handleUserCancel();
              }}>
              {dict.confirm}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        size="sm"
        title={dict.notes_title}>
        <div className={styles.modalBody}>
          <Text size="sm" className={styles.modalText}>
            {dict.confirm_save_notes}
          </Text>
          <div className={styles.modalActions}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowSaveConfirm(false);
                setNotesDraft(order.notes ?? "");
                setNotesEditing(false);
              }}>
              {dict.back}
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={async () => {
                setShowSaveConfirm(false);
                const ok = await saveNotes();
                if (!ok) setNotesEditing(true);
              }}>
              {dict.confirm}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showPosRedirectModal}
        onClose={() => setShowPosRedirectModal(false)}
        size="sm"
        title={dict.pay_in_pos}>
        <div className={styles.modalBody}>
          <Text size="sm" className={styles.modalText}>
            {dict.confirm_pay_in_pos.split("{number}")[0]}
            <strong>{order?.order_number}</strong>
            {dict.confirm_pay_in_pos.split("{number}")[1]}
          </Text>
          <div className={styles.modalActions}>
            <Button size="sm" variant="outline" onClick={() => setShowPosRedirectModal(false)}>
              {dict.back}
            </Button>
            <Button size="sm" variant="primary" onClick={handleRedirectToPos}>
              {dict.confirm}
            </Button>
          </div>
        </div>
      </Modal>

      <CampusScheduleOverlay
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        campus={order?.campus}
        dict={dict}
      />
    </>
  );
}
