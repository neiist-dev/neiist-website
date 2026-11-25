"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Alert, Badge, Button, ConfirmDialog, Heading, Modal, Table, Text } from "@neiist/ui";
import styles from "@/styles/components/shop/manage/modals/OrderDetailsOverlay.module.css";
import { Order } from "@/types/shop/order";
import { OrderStatus } from "@/types/shop/orderStatus";
import {
  getLocalizedOrderStatusLabel,
  getOrderProgressSteps,
  getStatusLabel,
  canTransitionOrderStatus,
  isCashPayment,
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
  dict: Dictionary["order_details"];
}

export default function OrderDetailOverlay({
  order: initialOrder,
  canManage = false,
  canDeliver = false,
  canOverride = false,
  basePath,
  dict,
}: OrderDetailOverlayProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(initialOrder);
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    message: ReactNode;
    isDestructive?: boolean;
    onConfirm: () => void | Promise<void>;
  } | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const [emailSending, setEmailSending] = useState(false);
  const [retryingHook, setRetryingHook] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);

  const paymentButtonLabel = getPaymentButtonLabel(dict, order);

  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  useEffect(() => {
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
      const updated = await setOrderItemStatusAction(itemId, newStatus);
      if (updated) {
        setOrder(updated);
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

  const showActionsColumn = canManage || canDeliver || isTicket;

  const progressSteps = getOrderProgressSteps(isTicket);

  const getStepLabel = (step: OrderStatus) => {
    if (isTicket && step === "paid") return dict.ticket_confirmed;
    if (step === "pending") return dict.step_pending;
    if (step === "paid") return dict.step_paid;
    if (step === "ready") return dict.step_ready;
    if (step === "delivered") return dict.step_delivered;
    return dict.status[step];
  };

  const activeStepIndex = progressSteps.indexOf(order.status);
  const progressWidth =
    progressSteps.length > 0 && activeStepIndex >= 0
      ? `${((activeStepIndex + 1) / progressSteps.length) * 100}%`
      : "0%";
  const progressBarStyle: CSSProperties = {
    "--progress-width": progressWidth,
  } as CSSProperties;

  const confirmOrderStatus = (status: OrderStatus) => {
    const statusLabel = getStatusLabel(status, dict.status, {
      isTicket,
      ticketConfirmedLabel: dict.ticket_confirmed,
    });
    const statusPrompt = dict.confirm_status.replace("{status}", statusLabel);
    setPendingConfirm({
      title: status === "cancelled" ? dict.cancel_order : statusPrompt,
      message: status === "cancelled" ? dict.confirm_cancel : statusPrompt,
      isDestructive: status === "cancelled",
      onConfirm: () => handleStatusChange(status),
    });
  };

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

  const paymentDisplay = getPaymentDisplay(order, dict);

  return (
    <>
      <Modal
        open={!!order}
        onClose={handleCloseImmediate}
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
          {paymentDisplay && (
            <>
              <FaArrowRightLong />
              {paymentDisplay}
            </>
          )}
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
          {order.payment_method &&
            !isCashPayment(order.payment_method) &&
            order.payment_reference?.trim() && (
              <div className={styles.infoColumn}>
                <div className={styles.infoItem}>
                  <Text size="sm" variant="muted">
                    {dict.payment_reference_label}
                  </Text>
                  <Text size="md">{order.payment_reference.trim()}</Text>
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
                                onClick={() =>
                                  setPendingConfirm({
                                    title: dict.mark_ready,
                                    message: dict.confirm_item_status
                                      .replace("{product}", item.product_name)
                                      .replace("{status}", dict.status.ready),
                                    onConfirm: () => handleItemStatusChange(item.id!, "ready"),
                                  })
                                }
                                disabled={updatingItemId === item.id}>
                                {updatingItemId === item.id ? dict.saving : dict.mark_ready_short}
                              </Button>
                            ) : item.status === "ready" && (canDeliver || canManage) ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setPendingConfirm({
                                    title: dict.mark_delivered,
                                    message: dict.confirm_item_status
                                      .replace("{product}", item.product_name)
                                      .replace("{status}", dict.status.delivered),
                                    onConfirm: () => handleItemStatusChange(item.id!, "delivered"),
                                  })
                                }
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
              <div>{order.notes ? order.notes : "-"}</div>
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
                    onClick={() =>
                      setPendingConfirm({
                        title: dict.resend_email,
                        message: dict.confirm_resend_email,
                        onConfirm: handleResendEmail,
                      })
                    }
                    disabled={emailSending}>
                    <FiMail className={styles.btnIcon} />
                    {emailSending ? dict.saving : dict.resend_email}
                  </Button>

                  {hasEventHook && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setPendingConfirm({
                          title: dict.retry_registration,
                          message: dict.confirm_retry_registration,
                          onConfirm: handleRetryHook,
                        })
                      }
                      disabled={retryingHook}>
                      <FiRefreshCw className={styles.btnIcon} />
                      {retryingHook ? dict.saving : dict.retry_registration}
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
                  onClick={() => confirmOrderStatus("cancelled")}>
                  {dict.cancel_order}
                </Button>
              )}

              {order.status === "pending"
                ? canSetPaid && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() =>
                        setPendingConfirm({
                          title: dict.pay_in_pos,
                          message: (
                            <>
                              {dict.confirm_pay_in_pos.split("{number}")[0]}
                              <strong>{order.order_number}</strong>
                              {dict.confirm_pay_in_pos.split("{number}")[1]}
                            </>
                          ),
                          onConfirm: handleRedirectToPos,
                        })
                      }>
                      {dict.pay_in_pos}
                    </Button>
                  )
                : canSetPaid && (
                    <Button size="sm" variant="primary" onClick={() => confirmOrderStatus("paid")}>
                      {paymentButtonLabel}
                    </Button>
                  )}

              {canSetReady && (
                <Button size="sm" variant="primary" onClick={() => confirmOrderStatus("ready")}>
                  {dict.mark_ready}
                </Button>
              )}

              {canSetDelivered && (
                <Button size="sm" variant="primary" onClick={() => confirmOrderStatus("delivered")}>
                  {dict.mark_delivered}
                </Button>
              )}
            </div>
          </div>
        ) : canDeliver && canSetDelivered ? (
          <div className={styles.modalFooter}>
            <div className={styles.footerRight}>
              <Button size="sm" variant="primary" onClick={() => confirmOrderStatus("delivered")}>
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
                    const isStepActive = activeStepIndex >= index;
                    const isStepAlert = step === "ready" && isDeadlineNear && isStepActive;

                    return (
                      <li
                        key={step}
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
                  onClick={() =>
                    setPendingConfirm({
                      title: dict.cancel_order,
                      message: dict.confirm_cancel,
                      isDestructive: true,
                      onConfirm: handleUserCancel,
                    })
                  }>
                  {dict.cancel_order}
                </Button>
              )}
            </div>
          </>
        )}
      </Modal>

      {pendingConfirm && (
        <ConfirmDialog
          open={!!pendingConfirm}
          title={pendingConfirm.title}
          message={pendingConfirm.message}
          confirmLabel={dict.confirm}
          cancelLabel={dict.back}
          isDestructive={pendingConfirm.isDestructive}
          onConfirm={async () => {
            const action = pendingConfirm.onConfirm;
            setPendingConfirm(null);
            await action();
          }}
          onCancel={() => setPendingConfirm(null)}
        />
      )}

      <CampusScheduleOverlay
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        campus={order?.campus}
        dict={dict}
      />
    </>
  );
}
