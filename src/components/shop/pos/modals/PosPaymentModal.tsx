"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Modal,
  ConfirmDialog,
  Button,
  Input,
  Field,
  Select,
  Card,
  Stack,
  Alert,
  Badge,
  Text,
} from "@neiist/ui";
import { FiExternalLink, FiClock } from "react-icons/fi";
import PaymentOverlay from "@/components/shop/PaymentOverlay";
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
import { CartItem } from "@/types/shop/product";
import type { Dictionary } from "@/i18n/dictionaries";
import styles from "@/styles/components/shop/pos/modals/PosPaymentModal.module.css";

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
    setStatusText: setMbwayStatusText,
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
        setMbwayState("error");
        setMbwayStatusText(dict.mbway_finalize_error);
        setIsSubmitting(false);
      }
    },
    onDeclined: () => {
      setIsSubmitting(false);
    },
    onExpired: () => {
      setIsSubmitting(false);
    },
    onFailed: () => {
      setIsSubmitting(false);
    },
    onError: () => {
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
          setIsSubmitting(false);
        }
      });

      es.addEventListener("failed", () => {
        closeSumUpSse();
        setTpaState("error");
        setTpaStatusText(dict.tpa_failed);
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

  const cancelTpaCheckout = useCallback(() => {
    closeSumUpSse();
    if (selectedReaderId) {
      void fetch(`/api/shop/sumup/readers/${encodeURIComponent(selectedReaderId)}/checkout`, {
        method: "DELETE",
      }).catch(() => {});
    }
  }, [closeSumUpSse, selectedReaderId]);

  const handleCancelTpa = () => {
    cancelTpaCheckout();
    setTpaState("idle");
    setIsSubmitting(false);
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

  const hasLoadedOrder = Boolean(orderNumber || (orderNumbers && orderNumbers.length > 0));

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
      if (mode === "identified" && canOverride && !hasLoadedOrder && method === "other")
        return [{ label: dict.reservation_option, value: RESERVATION }, option];

      return [option];
    });
  }, [mode, canOverride, hasLoadedOrder, dict]);

  const isBusy =
    isSubmitting ||
    tpaState === "waiting" ||
    tpaState === "error" ||
    mbwayState === "waiting" ||
    mbwayState === "error";

  return (
    <>
      <Modal
        open={open && step === "payment"}
        onClose={handleModalClose}
        size="md"
        closeOnBackdropClick={false}
        draggable={false}>
        <Modal.Header onClose={handleModalClose}>
          <Stack direction="row" justify="between" align="center" style={{ width: "100%" }}>
            <span>{dict.title}</span>
            <span className={styles.headerTotalValue}>{formatMoney(totalAmount)}</span>
          </Stack>
        </Modal.Header>

        <Modal.Body>
          <Stack gap="lg">
            {!isBusy && (
              <Field label={dict.method_label}>
                <Select
                  value={selectedMethod}
                  onChange={(val) => selectMethod(val as CheckoutChoice)}
                  options={paymentOptions}
                />
              </Field>
            )}

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
                {tpaState === "idle" && (
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
                      disabled={isSubmitting || readersLoading}
                    />
                  </Field>
                )}

                {tpaState === "waiting" && (
                  <PaymentOverlay
                    variant="inline"
                    state="loading"
                    iconSize={48}
                    title={tpaStatusText}
                    subtitle={dict.tpa_present_card}
                  />
                )}

                {tpaState === "error" && (
                  <PaymentOverlay
                    variant="inline"
                    state="error"
                    iconSize={48}
                    title={dict.payment_failed}
                    subtitle={tpaStatusText || dict.tpa_failed}
                  />
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
                    <Text size="sm" variant="muted" className={styles.noMarginText}>
                      {dict.mbway_hint.replace("{amount}", formatMoney(totalAmount))}
                    </Text>
                  </>
                )}

                {mbwayState === "waiting" && (
                  <PaymentOverlay
                    variant="inline"
                    state="loading"
                    iconSize={48}
                    title={mbwayStatusText || paymentsDict.mbway.title}
                    subtitle={dict.mbway_sent_to.replace("{phone}", mbWayPhone)}
                    badge={
                      <Badge variant="primary" size="md" className={styles.timerBadge}>
                        <FiClock /> {formatTimer(mbwayTimeLeft)}
                      </Badge>
                    }
                  />
                )}

                {mbwayState === "error" && (
                  <PaymentOverlay
                    variant="inline"
                    state="error"
                    iconSize={48}
                    title={dict.payment_failed}
                    subtitle={mbwayStatusText || paymentsDict.mbway.failed}
                  />
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
          {selectedMethod === "sumup-tpa" && tpaState === "waiting" ? (
            <Button variant="outline" onClick={handleCancelTpa}>
              {dict.cancel}
            </Button>
          ) : selectedMethod === "mbway" && mbwayState === "waiting" ? (
            <Button variant="outline" onClick={handleCancelMbWay}>
              {dict.cancel}
            </Button>
          ) : (
            <>
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

              {selectedMethod === "sumup-tpa" && tpaState === "error" && (
                <Button
                  variant="primary"
                  onClick={tpaSettlement ? handleRetryTpaSettlement : () => setTpaState("idle")}
                  disabled={isSubmitting}>
                  {dict.tpa_retry}
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

              {selectedMethod === "mbway" && mbwayState === "error" && (
                <Button variant="primary" onClick={resetMbWayPayment}>
                  {dict.mbway_retry}
                </Button>
              )}

              {selectedMethod === RESERVATION &&
                mode === "identified" &&
                canOverride &&
                !hasLoadedOrder && (
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
            </>
          )}
        </Modal.Footer>
      </Modal>

      <Modal
        open={open && step === "processing"}
        onClose={() => {}}
        size="md"
        closeOnBackdropClick={false}
        draggable={false}>
        <Modal.Body>
          <PaymentOverlay
            variant="inline"
            state="loading"
            iconSize={48}
            title={dict.processing_sale}
            subtitle={dict.registering}
          />
        </Modal.Body>
      </Modal>

      <Modal
        open={open && step === "success"}
        onClose={handleFinishModal}
        size="md"
        closeOnBackdropClick={false}
        draggable={false}>
        <Modal.Body>
          <PaymentOverlay
            variant="inline"
            state="success"
            iconSize={56}
            title={isReservation ? dict.success_reservation : dict.success_sale}
            subtitle={
              completedOrderNumber
                ? dict.order_number.replace("{number}", completedOrderNumber)
                : undefined
            }
          />
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
          if (tpaState === "waiting") cancelTpaCheckout();
          else closeSumUpSse();
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
