"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Modal,
  ConfirmDialog,
  Button,
  Input,
  Field,
  Select,
  Spinner,
  Card,
  Stack,
  Alert,
  Badge,
  Heading,
  Text,
} from "@neiist/ui";
import { FiExternalLink, FiClock } from "react-icons/fi";
import { PAYMENT_METHODS_BY_CHANNEL, RESERVATION, type CheckoutChoice } from "@/types/shop/payment";
import type { SumUpReader } from "@/types/shop/sumup";
import {
  getCashShortcutAmounts,
  calculateChangeDenominations,
  formatMoney,
} from "@/utils/shop/moneyUtils";
import { useMbWayPayment } from "@/hooks/shop/useMbWayPayment";
import { formatTimer, toCartOrderItems } from "@/utils/shop/shopUtils";
import type { CreateOrderPaymentInput } from "@/types/shop/order";
import styles from "@/styles/components/shop/pos/modals/PosPaymentModal.module.css";
import { CartItem } from "@/types/shop/product";
import type { Dictionary } from "@/i18n/dictionaries";

export interface PosPaymentConfirmData {
  method: CheckoutChoice;
  paymentStatus: NonNullable<CreateOrderPaymentInput["status"]>;
  reference?: string;
  orderNumber?: string;
}

export interface PosPaymentResult {
  orderNumber: string;
  isReservation?: boolean;
}

export interface PosPaymentModalProps {
  open: boolean;
  onClose: () => void;
  mode: "identified" | "fast";
  totalAmount: number;
  orderNumber?: string;
  orderNumbers?: string[];
  discountCode?: string;
  userIstid?: string;
  customerPhone?: string;
  stationName?: string;
  cartItems?: CartItem[];
  ordersBasePath?: string;
  canOverride?: boolean;
  onConfirm: (_data: PosPaymentConfirmData) => Promise<PosPaymentResult | void>;
  onFinish?: () => void;
  dict: Dictionary["pos"]["payment"];
  paymentsDict: Dictionary["payments"];
}

type ModalStep = "payment" | "processing" | "success" | "confirm_exit";

export default function PosPaymentModal({
  open,
  onClose,
  mode,
  totalAmount,
  orderNumber,
  orderNumbers,
  discountCode,
  userIstid,
  customerPhone,
  stationName = "Posto POS",
  cartItems = [],
  ordersBasePath,
  canOverride = false,
  onConfirm,
  onFinish,
  dict,
  paymentsDict,
}: PosPaymentModalProps) {
  const [step, setStep] = useState<ModalStep>("payment");
  const [selectedMethod, setSelectedMethod] = useState<CheckoutChoice>("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [completedOrderNumber, setCompletedOrderNumber] = useState<string | null>(null);
  const [isReservation, setIsReservation] = useState(false);

  const shortcuts = useMemo(() => getCashShortcutAmounts(totalAmount), [totalAmount]);
  const [cashReceived, setCashReceived] = useState<string>(
    shortcuts[0] ? shortcuts[0].toFixed(2) : totalAmount.toFixed(2)
  );

  const [readers, setReaders] = useState<SumUpReader[]>([]);
  const [readersLoading, setReadersLoading] = useState(false);
  const [selectedReaderId, setSelectedReaderId] = useState<string>("");
  const [tpaState, setTpaState] = useState<"idle" | "waiting" | "success" | "error">("idle");
  const [tpaStatusText, setTpaStatusText] = useState("");
  const [tpaSettlement, setTpaSettlement] = useState<{
    reference: string;
  } | null>(null);
  const sumUpEventSourceRef = useRef<EventSource | null>(null);

  const [activeOrderNumber, setActiveOrderNumber] = useState<string | null>(orderNumber || null);
  const [mbWayPhone, setMbWayPhone] = useState<string>(customerPhone || "");

  const [otherReference, setOtherReference] = useState("");

  const closeSumUpSse = useCallback(() => {
    if (sumUpEventSourceRef.current) {
      sumUpEventSourceRef.current.close();
      sumUpEventSourceRef.current = null;
    }
  }, []);

  const handlePaymentCompleted = useCallback(
    (result: PosPaymentResult | void) => {
      if (mode === "fast" || !result) {
        onClose();
        return;
      }

      setCompletedOrderNumber(result.orderNumber);
      setIsReservation(Boolean(result.isReservation));
      setStep("success");
    },
    [mode, onClose]
  );

  const {
    state: mbwayState,
    setState: setMbwayState,
    statusText: mbwayStatusText,
    timeLeft: mbwayTimeLeft,
    startPayment: startMbWayPayment,
    cancel: cancelMbWayPayment,
    reset: resetMbWayPayment,
    closeSse: closeMbWaySse,
  } = useMbWayPayment({
    messages: paymentsDict.mbway,
    onPaid: async (data) => {
      Alert.success(dict.mbway_paid_toast);
      setStep("processing");
      try {
        const result = await onConfirm({
          method: "mbway",
          paymentStatus: "successful",
          reference: data.requestId || undefined,
          orderNumber: data.orderNumber,
        });
        handlePaymentCompleted(result);
      } catch {
        setStep("payment");
        Alert.error(dict.mbway_finalize_error);
        setIsSubmitting(false);
      }
    },
    onDeclined: (msg) => {
      Alert.error(msg || paymentsDict.mbway.declined);
      setIsSubmitting(false);
    },
    onExpired: (msg) => {
      Alert.error(msg || paymentsDict.mbway.expired);
      setIsSubmitting(false);
    },
    onFailed: (msg) => {
      Alert.error(msg || paymentsDict.mbway.failed);
      setIsSubmitting(false);
    },
    onError: (msg) => {
      Alert.error(msg);
      setIsSubmitting(false);
    },
  });

  // Cleanup SSE connections on modal close/unmount
  useEffect(() => {
    return () => {
      closeSumUpSse();
      closeMbWaySse();
    };
  }, [closeSumUpSse, closeMbWaySse]);

  // Sync state when modal opens
  useEffect(() => {
    if (open) {
      setStep("payment");
      setSelectedMethod("cash");
      setIsSubmitting(false);
      setTpaState("idle");
      setTpaStatusText("");
      setTpaSettlement(null);
      resetMbWayPayment();
      setOtherReference("");
      setActiveOrderNumber(orderNumber || null);
      if (customerPhone) setMbWayPhone(customerPhone);
      setCashReceived(shortcuts[0] ? shortcuts[0].toFixed(2) : totalAmount.toFixed(2));
    } else {
      closeSumUpSse();
      closeMbWaySse();
    }
  }, [
    open,
    totalAmount,
    shortcuts,
    orderNumber,
    customerPhone,
    closeSumUpSse,
    closeMbWaySse,
    resetMbWayPayment,
  ]);

  // Fetch SumUp readers when reader payment selected
  useEffect(() => {
    if (!open || selectedMethod !== "sumup-tpa" || readers.length > 0) return;
    const controller = new AbortController();
    setReadersLoading(true);
    fetch("/api/shop/sumup/readers", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { readers?: SumUpReader[] } | null) => {
        const list = Array.isArray(data?.readers) ? data.readers : [];
        setReaders(list);
        const onlineReader = list.find((r) => r.status === "online" || r.status === "paired");
        if (onlineReader) {
          setSelectedReaderId(onlineReader.id);
        } else if (list[0]) {
          setSelectedReaderId(list[0].id);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        Alert.error(dict.reader_load_error);
      })
      .finally(() => setReadersLoading(false));

    return () => {
      controller.abort();
    };
  }, [open, selectedMethod, readers.length, dict.reader_load_error]);

  const selectMethod = (method: CheckoutChoice) => {
    setSelectedMethod(method);
    setTpaState("idle");
    setMbwayState("idle");
    closeSumUpSse();
    closeMbWaySse();
  };

  // Initiate SumUp TPA Checkout via SSE
  const handleInitiateTpa = async () => {
    if (!selectedReaderId) {
      Alert.error(dict.reader_select_error);
      return;
    }

    closeSumUpSse();
    setTpaState("waiting");
    setTpaStatusText(dict.tpa_starting);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/shop/sumup/readers/${selectedReaderId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalAmount,
          currency: "EUR",
          description: `POS ${activeOrderNumber || "Balcao"} - ${stationName}`,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || dict.tpa_start_error);
      }

      const checkoutData = await res.json();
      const clientTxId = checkoutData.client_transaction_id;
      setTpaStatusText(dict.tpa_present_card);

      const sseUrl = `/api/shop/sumup/readers/${selectedReaderId}/checkout/status?client_transaction_id=${encodeURIComponent(clientTxId)}`;
      const es = new EventSource(sseUrl);
      sumUpEventSourceRef.current = es;

      es.addEventListener("paid", async (event: MessageEvent) => {
        closeSumUpSse();
        setTpaState("success");
        setTpaStatusText(dict.tpa_paid);
        Alert.success(dict.tpa_paid_toast);

        let reference = clientTxId;
        try {
          const parsed = JSON.parse(event.data);
          reference = parsed.id || clientTxId;
        } catch {
          // ignore
        }

        setTpaSettlement({ reference });
        setStep("processing");

        try {
          const result = await onConfirm({
            method: "sumup-tpa",
            paymentStatus: "successful",
            reference,
            orderNumber: activeOrderNumber || undefined,
          });
          setTpaSettlement(null);
          handlePaymentCompleted(result);
        } catch {
          setStep("payment");
          setTpaState("error");
          setTpaStatusText(dict.tpa_register_failed);
          Alert.error(dict.tpa_register_failed_toast);
          setIsSubmitting(false);
        }
      });

      es.addEventListener("failed", () => {
        closeSumUpSse();
        setTpaState("error");
        setTpaStatusText(dict.tpa_failed);
        Alert.error(dict.tpa_failed_toast);
        setIsSubmitting(false);
      });

      es.onerror = () => {
        // SSE reconnects automatically unless server terminates
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : dict.tpa_error;
      closeSumUpSse();
      setTpaState("error");
      setTpaStatusText(msg);
      Alert.error(msg);
      setIsSubmitting(false);
    }
  };

  const handleRetryTpaSettlement = async () => {
    if (!tpaSettlement) return;
    setIsSubmitting(true);
    setStep("processing");
    try {
      const result = await onConfirm({
        method: "sumup-tpa",
        paymentStatus: "successful",
        reference: tpaSettlement.reference,
        orderNumber: activeOrderNumber || undefined,
      });
      setTpaSettlement(null);
      handlePaymentCompleted(result);
    } catch {
      setStep("payment");
      setTpaState("error");
      setTpaStatusText(dict.tpa_retry_failed);
      Alert.error(dict.tpa_retry_failed_toast);
      setIsSubmitting(false);
    }
  };

  // Initiate IfThenPay MB WAY Push via SSE
  const handleStartMbWay = async () => {
    const targetPhone = mbWayPhone.trim() || customerPhone;
    if (!targetPhone) {
      Alert.error(dict.mbway_phone_error);
      return;
    }

    const hasExistingOrder = Boolean(orderNumber || (orderNumbers && orderNumbers.length > 0));
    setIsSubmitting(true);
    try {
      const res = await startMbWayPayment({
        orderNumber: hasExistingOrder ? orderNumber : undefined,
        orderNumbers: orderNumbers && orderNumbers.length > 0 ? orderNumbers : undefined,
        discountCode,
        userIstid,
        phone: targetPhone,
        orderSource: mode === "fast" ? "fast-pos" : "pos",
        items: !hasExistingOrder ? toCartOrderItems(cartItems) : undefined,
      });

      if (res?.orderNumber) {
        setActiveOrderNumber(res.orderNumber);
      }
    } catch {
      setIsSubmitting(false);
    }
  };

  const handleCancelMbWay = () => {
    cancelMbWayPayment();
    setIsSubmitting(false);
  };

  // Confirm cash, reservation, or other payment
  const handleConfirmAction = async (status: NonNullable<CreateOrderPaymentInput["status"]>) => {
    setIsSubmitting(true);
    setStep("processing");

    try {
      const result = await onConfirm({
        method: selectedMethod,
        paymentStatus: status,
        reference: selectedMethod === "other" ? otherReference.trim() : undefined,
        orderNumber: activeOrderNumber || undefined,
      });

      handlePaymentCompleted(result);
    } catch (err: unknown) {
      setStep("payment");
      const msg = err instanceof Error ? err.message : dict.settle_error;
      Alert.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishModal = () => {
    closeSumUpSse();
    closeMbWaySse();
    if (onFinish) onFinish();
    onClose();
  };

  const handleModalClose = () => {
    if (tpaState === "waiting" || mbwayState === "waiting") {
      setStep("confirm_exit");
      return;
    }
    handleFinishModal();
  };

  const receivedNum = Number(cashReceived.replace(",", ".")) || 0;
  const changeNum = Math.max(0, receivedNum - totalAmount);
  const changeDenominations = useMemo(() => calculateChangeDenominations(changeNum), [changeNum]);

  const paymentOptions = useMemo(() => {
    type PosMethod = (typeof PAYMENT_METHODS_BY_CHANNEL.pos)[number];

    const labels: Record<PosMethod, string> = {
      cash: dict.cash_option,
      "sumup-tpa": dict.tpa_option,
      mbway: dict.mbway_option,
      other: dict.other_option,
    };
    const methods: ReadonlyArray<PosMethod> =
      mode === "fast" ? PAYMENT_METHODS_BY_CHANNEL["fast-pos"] : PAYMENT_METHODS_BY_CHANNEL.pos;

    return methods.flatMap((method) => {
      const option: { label: string; value: CheckoutChoice } = {
        label: labels[method],
        value: method,
      };
      if (mode === "identified" && canOverride && method === "other")
        return [{ label: dict.reservation_option, value: RESERVATION }, option];

      return [option];
    });
  }, [mode, canOverride, dict]);

  const isBusy = isSubmitting || tpaState === "waiting" || mbwayState === "waiting";

  return (
    <>
      <Modal open={open && step === "payment"} onClose={handleModalClose} size="md">
        <Modal.Header>
          <Stack direction="row" justify="between" align="center" style={{ width: "100%" }}>
            <span>{dict.title}</span>
            <span className={styles.headerTotalValue}>{formatMoney(totalAmount)}</span>
          </Stack>
        </Modal.Header>

        <Modal.Body>
          <Stack gap="lg">
            <Field label={dict.method_label}>
              <Select
                value={selectedMethod}
                onChange={(val) => selectMethod(val as CheckoutChoice)}
                options={paymentOptions}
                disabled={isBusy}
              />
            </Field>

            {selectedMethod === "cash" && (
              <Stack gap="md">
                <Field label={dict.cash_received_label}>
                  <Input
                    type="number"
                    step="0.01"
                    min={totalAmount}
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    disabled={isSubmitting}
                    autoFocus
                  />
                </Field>

                <Stack direction="column" gap="sm">
                  <Text size="sm" variant="muted" className={styles.shortcutLabel}>
                    {dict.shortcuts}
                  </Text>
                  <Stack direction="row" gap="sm" wrap>
                    {shortcuts.map((amt) => {
                      const isActive = Math.abs(receivedNum - amt) < 0.001;
                      return (
                        <Button
                          key={amt}
                          type="button"
                          size="sm"
                          variant={isActive ? "primary" : "outline"}
                          color={isActive ? "primary" : "neutral"}
                          onClick={() => setCashReceived(amt.toFixed(2))}
                          disabled={isSubmitting}>
                          {formatMoney(amt)}
                        </Button>
                      );
                    })}
                  </Stack>
                </Stack>

                {receivedNum >= totalAmount && (
                  <Card variant="flat">
                    <Card.Body>
                      <Stack direction="column" gap="sm">
                        <Stack direction="row" justify="between" align="center">
                          <strong>{dict.change_title}</strong>
                          <strong className={styles.changeAmount}>{formatMoney(changeNum)}</strong>
                        </Stack>
                        {changeDenominations && (
                          <Text size="sm" variant="muted">
                            {changeDenominations}
                          </Text>
                        )}
                      </Stack>
                    </Card.Body>
                  </Card>
                )}
              </Stack>
            )}

            {selectedMethod === "sumup-tpa" && (
              <Stack gap="md">
                <Field label={dict.reader_label}>
                  <Select
                    value={selectedReaderId}
                    onChange={(val) => setSelectedReaderId(val)}
                    options={
                      readers.length > 0
                        ? readers.map((r) => {
                            const statusLabel =
                              r.status === "online"
                                ? dict.reader_online
                                : r.status === "paired"
                                  ? dict.reader_paired
                                  : dict.reader_offline;
                            return {
                              label: `${r.name || dict.reader_default_name} (${statusLabel})`,
                              value: r.id,
                            };
                          })
                        : [
                            {
                              label: readersLoading ? dict.reader_searching : dict.reader_none,
                              value: "",
                            },
                          ]
                    }
                    disabled={isSubmitting || tpaState === "waiting" || readersLoading}
                  />
                </Field>

                {tpaState === "waiting" && (
                  <Card>
                    <Card.Body>
                      <Stack align="center" gap="md">
                        <Spinner size="md" />
                        <div className={styles.centerText}>
                          <strong>{tpaStatusText}</strong>
                          <Text size="sm" variant="muted">
                            Total: <strong>{formatMoney(totalAmount)}</strong>
                          </Text>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            closeSumUpSse();
                            setTpaState("idle");
                            setIsSubmitting(false);
                          }}>
                          {dict.tpa_cancel_operation}
                        </Button>
                      </Stack>
                    </Card.Body>
                  </Card>
                )}

                {tpaState === "error" && !tpaSettlement && (
                  <Card className={styles.dangerBorderCard}>
                    <Card.Body>
                      <Stack align="center" gap="sm">
                        <Badge variant="danger" size="md">
                          {dict.tpa_not_completed}
                        </Badge>
                        <Text className={styles.dangerTextCenter}>{tpaStatusText}</Text>
                        <Button size="sm" variant="primary" onClick={handleInitiateTpa}>
                          {dict.tpa_retry}
                        </Button>
                      </Stack>
                    </Card.Body>
                  </Card>
                )}
              </Stack>
            )}

            {selectedMethod === "mbway" && (
              <Stack gap="md">
                {mbwayState === "idle" && (
                  <>
                    <Field label={dict.mbway_phone_label}>
                      <Input
                        type="tel"
                        placeholder={dict.mbway_phone_placeholder}
                        value={mbWayPhone}
                        onChange={(e) => setMbWayPhone(e.target.value)}
                        disabled={isSubmitting}
                        autoFocus
                      />
                    </Field>
                    <Text size="sm" variant="muted">
                      {dict.mbway_hint.replace("{amount}", formatMoney(totalAmount))}
                    </Text>
                  </>
                )}

                {mbwayState === "waiting" && (
                  <Card>
                    <Card.Body>
                      <Stack align="center" gap="md">
                        <Spinner size="md" />
                        <Stack align="center" gap="sm" className={styles.centerText}>
                          <strong>{mbwayStatusText}</strong>
                          <Text size="sm" variant="muted">
                            {dict.mbway_sent_to
                              .replace("{phone}", mbWayPhone)
                              .replace("{amount}", formatMoney(totalAmount))}
                          </Text>
                          <Badge variant="primary" size="md" className={styles.timerBadge}>
                            <FiClock /> {formatTimer(mbwayTimeLeft)}
                          </Badge>
                        </Stack>
                        <Button variant="outline" size="sm" onClick={handleCancelMbWay}>
                          {dict.mbway_cancel}
                        </Button>
                      </Stack>
                    </Card.Body>
                  </Card>
                )}

                {mbwayState === "error" && (
                  <Card className={styles.dangerBorderCard}>
                    <Card.Body>
                      <Stack align="center" gap="sm">
                        <Badge variant="danger" size="md">
                          {dict.mbway_declined_badge}
                        </Badge>
                        <Text className={styles.dangerTextCenter}>{mbwayStatusText}</Text>
                        <Stack direction="row" gap="sm">
                          <Button size="sm" variant="primary" onClick={handleStartMbWay}>
                            {dict.mbway_retry}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedMethod("cash")}>
                            {dict.mbway_switch_cash}
                          </Button>
                        </Stack>
                      </Stack>
                    </Card.Body>
                  </Card>
                )}
              </Stack>
            )}

            {selectedMethod === "other" && mode === "identified" && (
              <Field label={dict.other_reference_label}>
                <Input
                  placeholder={dict.other_reference_placeholder}
                  value={otherReference}
                  onChange={(e) => setOtherReference(e.target.value)}
                  disabled={isSubmitting}
                  autoFocus
                  required
                />
              </Field>
            )}
          </Stack>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline" onClick={handleModalClose} disabled={isBusy}>
            {dict.back}
          </Button>

          {selectedMethod === "cash" && (
            <Button
              variant="primary"
              onClick={() => handleConfirmAction("successful")}
              disabled={isSubmitting || receivedNum < totalAmount}>
              {isSubmitting ? dict.registering : dict.confirm_payment}
            </Button>
          )}

          {selectedMethod === "sumup-tpa" && tpaState === "idle" && (
            <Button
              variant="primary"
              onClick={handleInitiateTpa}
              disabled={isSubmitting || !selectedReaderId}>
              {dict.tpa_send}
            </Button>
          )}

          {selectedMethod === "sumup-tpa" && tpaState === "error" && tpaSettlement && (
            <Button variant="primary" onClick={handleRetryTpaSettlement} disabled={isSubmitting}>
              {dict.tpa_retry_settlement}
            </Button>
          )}

          {selectedMethod === "mbway" && mbwayState === "idle" && (
            <Button
              variant="primary"
              onClick={handleStartMbWay}
              disabled={isSubmitting || !mbWayPhone.trim()}>
              {dict.mbway_send}
            </Button>
          )}

          {selectedMethod === RESERVATION && mode === "identified" && canOverride && (
            <Button
              variant="primary"
              onClick={() => handleConfirmAction("pending")}
              disabled={isSubmitting}>
              {isSubmitting ? dict.reservation_creating : dict.reservation_create}
            </Button>
          )}

          {selectedMethod === "other" && mode === "identified" && (
            <Button
              variant="primary"
              onClick={() => handleConfirmAction("successful")}
              disabled={isSubmitting || !otherReference.trim()}>
              {isSubmitting ? dict.registering : dict.register_sale}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      <Modal open={open && step === "processing"} onClose={() => {}} size="sm">
        <Modal.Body>
          <Stack align="center" gap="md" className={styles.processingStack}>
            <Spinner size="lg" />
            <strong>{dict.processing_sale}</strong>
          </Stack>
        </Modal.Body>
      </Modal>

      <Modal open={open && step === "success"} onClose={handleFinishModal} size="md">
        <Modal.Body>
          <Stack align="center" gap="md" className={styles.successStack}>
            <Spinner size={72} state="success" />
            <Heading level={3}>
              {isReservation ? dict.success_reservation : dict.success_sale}
            </Heading>
            {completedOrderNumber && (
              <Text variant="muted" size="lg">
                <strong>{dict.order_number.replace("{number}", completedOrderNumber)}</strong>
              </Text>
            )}
          </Stack>
        </Modal.Body>
        <Modal.Footer>
          {ordersBasePath && completedOrderNumber && (
            <Button
              variant="outline"
              onClick={() => {
                handleFinishModal();
                window.open(`${ordersBasePath}/orders?orderId=${completedOrderNumber}`, "_blank");
              }}>
              <FiExternalLink /> {dict.view_order}
            </Button>
          )}
          <Button variant="primary" onClick={handleFinishModal}>
            {dict.new_customer}
          </Button>
        </Modal.Footer>
      </Modal>

      <ConfirmDialog
        open={open && step === "confirm_exit"}
        title={dict.confirm_exit_title}
        message={dict.confirm_exit_body}
        cancelLabel={dict.keep_waiting}
        confirmLabel={dict.confirm_exit}
        isDestructive
        onCancel={() => setStep("payment")}
        onConfirm={() => {
          closeSumUpSse();
          closeMbWaySse();
          setTpaState("idle");
          setMbwayState("idle");
          setStep("payment");
          handleFinishModal();
        }}
      />
    </>
  );
}
