"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MdClose } from "react-icons/md";
import { toast } from "sonner";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import { Order } from "@/types/shop/order";
import { getPaymentLabel, PaymentMethod, PENDING_PAYMENT_METHODS } from "@/types/shop/payment";
import { getOrderKindFromItems, getOrderKindRules } from "@/utils/shop/orderKindUtils";
import type { SumUpReader } from "@/types/sumup";
import PaymentProcessingSpinner from "@/components/shop/PaymentProcessingSpinner";
import styles from "@/styles/components/shop/PosPaymentOverlay.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

type Props = {
  open: boolean;
  order: Order;
  onCloseAction: () => void;
  onOrderUpdatedAction: (_order: Order) => void;
  initialPaymentMethod?: PaymentMethod;
  lockPaymentMethod?: boolean;
  autoStart?: boolean;
  initialReaderId?: string;
  initialReaderName?: string;
  reopenOrderUrl?: string;
  dict: Dictionary["pos_payment"];
};

type FlowState = "form" | "processing" | "success";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function PosPaymentOverlay({
  open,
  order,
  onCloseAction,
  onOrderUpdatedAction,
  initialPaymentMethod,
  lockPaymentMethod = false,
  autoStart = false,
  initialReaderId,
  initialReaderName,
  reopenOrderUrl,
  dict,
}: Props) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initialPaymentMethod ?? "cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [readers, setReaders] = useState<SumUpReader[]>([]);
  const [readersLoading, setReadersLoading] = useState(false);
  const [selectedReaderId, setSelectedReaderId] = useState(initialReaderId ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [flowState, setFlowState] = useState<FlowState>("form");
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const autoStartedRef = useRef(false);
  const confirmInFlightRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const selectedReaderName = useMemo(
    () =>
      readers.find((reader) => reader.id === selectedReaderId)?.name ||
      initialReaderName ||
      selectedReaderId,
    [readers, selectedReaderId, initialReaderName]
  );

  const { orderKind } = useMemo(() => getOrderKindFromItems(order.items), [order.items]);

  const isAlreadyInPerson =
    order.payment_method === "in-person" || initialPaymentMethod === "in-person";
  const isExistingOrderPaymentFlow =
    (initialPaymentMethod ?? order.payment_method)
      ? PENDING_PAYMENT_METHODS.has((initialPaymentMethod ?? order.payment_method)!)
      : false;
  const title = isExistingOrderPaymentFlow
    ? dict.title_register_payment
    : dict.title_finalize_order;

  const availablePaymentMethods = useMemo(() => {
    const methods = getOrderKindRules(orderKind, "pos").paymentMethods;
    if (isExistingOrderPaymentFlow || isAlreadyInPerson) {
      return methods.filter(
        (method): method is Exclude<PaymentMethod, "in-person"> => method !== "in-person"
      );
    }
    const orderWithInPerson: PaymentMethod[] = ["cash", "in-person", "sumup-tpa", "mbway", "other"];
    return orderWithInPerson.filter((m) => methods.includes(m) || m === "in-person");
  }, [orderKind, isExistingOrderPaymentFlow, isAlreadyInPerson]);

  useEffect(() => {
    if (!open || paymentMethod !== "sumup-tpa") return;

    const controller = new AbortController();
    setReadersLoading(true);
    setError(null);

    fetch("/api/shop/sumup/readers", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || dict.error_load_readers);
        return data;
      })
      .then((data) => {
        const nextReaders: SumUpReader[] = Array.isArray(data?.readers) ? data.readers : [];
        setReaders(nextReaders);

        if (nextReaders.length > 0) {
          const preferredExists =
            !!initialReaderId &&
            nextReaders.some((reader: SumUpReader) => reader.id === initialReaderId);

          if (preferredExists) {
            setSelectedReaderId(initialReaderId!);
          } else {
            setSelectedReaderId(nextReaders[0].id);
          }
        } else {
          setSelectedReaderId("");
        }
      })
      .catch((error) => {
        if (error?.name !== "AbortError") setError(error.message || dict.error_load_readers);
      })
      .finally(() => {
        if (!controller.signal.aborted) setReadersLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [open, paymentMethod, initialReaderId, dict.error_load_readers]);

  useEffect(() => {
    if (!open) return;

    autoStartedRef.current = false;
    const defaultMethod = availablePaymentMethods[0] ?? "cash";
    const canUseInitialMethod =
      initialPaymentMethod &&
      initialPaymentMethod !== "in-person" &&
      availablePaymentMethods.includes(initialPaymentMethod);
    const preferredMethod = canUseInitialMethod ? initialPaymentMethod : defaultMethod;

    setPaymentMethod(preferredMethod);
    setSelectedReaderId(initialReaderId ?? "");
    setError(null);
    setStatusMessage("");
    setFlowState("form");
    setCompletedOrder(null);
    setShowConfirmDialog(false);
  }, [open, initialPaymentMethod, initialReaderId, availablePaymentMethods]);

  useEffect(() => {
    if (!open) return;

    if (paymentMethod === "sumup-tpa") {
      setSelectedReaderId("");
    }
  }, [paymentMethod, open]);

  const refreshOrder = useCallback(async (): Promise<Order | null> => {
    const res = await fetch(`/api/shop/orders/${order.id}`, { cache: "no-store" });
    if (!res.ok) return null;

    return (await res.json().catch(() => null)) as Order | null;
  }, [order.id]);

  const updateOrderFields = useCallback(
    async (fields: Record<string, unknown>): Promise<Order> => {
      const res = await fetch(`/api/shop/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });

      const data = (await res.json().catch(() => null)) as { error?: string } | Order | null;
      if (!res.ok || !data || !("id" in data))
        throw new Error((data as { error?: string } | null)?.error || dict.error_update_order);

      return data;
    },
    [order.id, dict.error_update_order]
  );

  const finalizePaidOrder = useCallback(
    async (paymentReference: string): Promise<Order> => {
      const res = await fetch(`/api/shop/orders/${order.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentReference }),
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorData?.error || dict.error_finalize_order);
      }

      const data = (await res.json().catch(() => null)) as Order | null;
      if (!data || !("id" in data)) throw new Error(dict.error_invalid_server_response);

      return data;
    },
    [order.id, dict.error_finalize_order, dict.error_invalid_server_response]
  );

  const pollReaderTransactionPaid = useCallback(
    async (
      clientTransactionId: string
    ): Promise<{ paid: boolean; transactionCode: string | null }> => {
      const startedAt = Date.now();

      while (isMountedRef.current && Date.now() - startedAt < 90_000) {
        const txRes = await fetch(
          `/api/shop/sumup/transactions/status?clientTransactionId=${encodeURIComponent(clientTransactionId)}`,
          { cache: "no-store" }
        );
        const txData = (await txRes.json().catch(() => null)) as {
          paid?: boolean;
          status?: string;
          error?: string;
          transactionCode?: string | null;
        } | null;

        if (txRes.ok && txData?.paid)
          return { paid: true, transactionCode: txData.transactionCode ?? null };

        const latestOrder = await refreshOrder();
        if (latestOrder && ["paid", "ready", "delivered"].includes(latestOrder.status))
          return { paid: true, transactionCode: null };

        setStatusMessage(
          txData?.status
            ? dict.reader_status
                .replace("{name}", selectedReaderName)
                .replace("{status}", String(txData.status).toLowerCase())
            : dict.awaiting_terminal
        );

        await sleep(2500);
      }

      return { paid: false, transactionCode: null };
    },
    [refreshOrder, selectedReaderName, dict.reader_status, dict.awaiting_terminal]
  );

  const runTpaFlow = useCallback(async (): Promise<Order | null> => {
    if (!selectedReaderId) throw new Error(dict.select_reader_error);

    setStatusMessage(dict.starting_payment);

    const createRes = await fetch(
      `/api/shop/sumup/readers/${encodeURIComponent(selectedReaderId)}/checkout`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      }
    );

    const createData = (await createRes.json().catch(() => null)) as {
      error?: string;
      details?: unknown;
      clientTransactionId?: string | null;
    } | null;

    if (!createRes.ok || !createData?.clientTransactionId) {
      if (createRes.status === 422) {
        const latestOrder = await refreshOrder();
        const existingClientTransactionId =
          typeof latestOrder?.payment_reference === "string"
            ? latestOrder.payment_reference.trim()
            : "";

        if (existingClientTransactionId) {
          setStatusMessage(dict.checkout_started);
          const pollResult = await pollReaderTransactionPaid(existingClientTransactionId);

          if (pollResult.paid) {
            const paymentReference = pollResult.transactionCode || existingClientTransactionId;
            await updateOrderFields({
              payment_method: "sumup-tpa",
              payment_reference: paymentReference,
            });
            return await finalizePaidOrder(paymentReference);
          }

          const pending = await updateOrderFields({
            payment_method: "sumup-tpa",
            payment_reference: existingClientTransactionId,
          });
          toast.info(dict.payment_initiated_toast);
          return pending;
        }
      }

      const apiError = createData?.error || dict.failed_terminal;
      throw new Error(apiError);
    }

    setStatusMessage(dict.payment_sent);
    const pollResult = await pollReaderTransactionPaid(createData.clientTransactionId);

    if (pollResult.paid) {
      const paymentReference = pollResult.transactionCode || createData.clientTransactionId;
      await updateOrderFields({
        payment_method: "sumup-tpa",
        payment_reference: paymentReference,
      });
      return await finalizePaidOrder(paymentReference);
    }

    const pending = await updateOrderFields({
      payment_method: "sumup-tpa",
      payment_reference: createData.clientTransactionId,
    });
    toast.info(dict.payment_initiated_toast);
    return pending;
  }, [
    selectedReaderId,
    order.id,
    refreshOrder,
    pollReaderTransactionPaid,
    updateOrderFields,
    finalizePaidOrder,
    dict.select_reader_error,
    dict.starting_payment,
    dict.checkout_started,
    dict.payment_initiated_toast,
    dict.failed_terminal,
    dict.payment_sent,
  ]);

  const handleConfirm = useCallback(async () => {
    if (confirmInFlightRef.current) return;

    confirmInFlightRef.current = true;
    setError(null);
    setIsSubmitting(true);
    setFlowState("processing");
    setStatusMessage(dict.processing_payment);
    let succeeded = false;

    try {
      let updated: Order | null = null;

      if (paymentMethod === "in-person") {
        await updateOrderFields({ payment_method: "in-person" });
        toast.info(dict.in_person_notice, { id: "in-person-notice" });
        onOrderUpdatedAction({ ...order, payment_method: "in-person", status: "pending" });
        onCloseAction();
        return;
      } else if (paymentMethod === "cash") {
        await updateOrderFields({ payment_method: "cash" });
        updated = await finalizePaidOrder("cash");
      } else if (paymentMethod === "mbway") {
        const mbwayRef = order.mbway_number?.trim() ?? "";
        if (!mbwayRef) throw new Error(dict.error_mbway_missing);
        await updateOrderFields({ payment_method: "mbway", payment_reference: mbwayRef });
        updated = await finalizePaidOrder(mbwayRef);
      } else if (paymentMethod === "other") {
        if (!paymentReference.trim()) throw new Error(dict.fill_reference);

        const ref = paymentReference.trim();
        await updateOrderFields({
          payment_method: paymentMethod,
          payment_reference: ref,
        });
        updated = await finalizePaidOrder(ref);
      } else if (paymentMethod === "sumup-tpa") {
        updated = await runTpaFlow();
      }

      if (updated) {
        if (["paid", "ready", "delivered"].includes(updated.status)) {
          setCompletedOrder(updated);
          setStatusMessage(dict.payment_confirmed);
          setFlowState("success");
          succeeded = true;
        } else {
          onOrderUpdatedAction(updated);
          onCloseAction();
        }
      } else {
        setFlowState("form");
      }
    } catch (error) {
      setError((error as Error).message || dict.error_payment);
      setFlowState("form");
    } finally {
      setIsSubmitting(false);
      confirmInFlightRef.current = false;
      if (!succeeded) setStatusMessage("");
    }
  }, [
    paymentMethod,
    paymentReference,
    order,
    updateOrderFields,
    finalizePaidOrder,
    runTpaFlow,
    onOrderUpdatedAction,
    onCloseAction,
    dict.processing_payment,
    dict.error_mbway_missing,
    dict.fill_reference,
    dict.payment_confirmed,
    dict.error_payment,
    dict.in_person_notice,
  ]);

  useEffect(() => {
    if (!open || !autoStart || autoStartedRef.current) return;

    if (paymentMethod !== "sumup-tpa") return;

    if (!selectedReaderId || isSubmitting || readersLoading) return;

    autoStartedRef.current = true;
    void handleConfirm();
  }, [
    open,
    autoStart,
    paymentMethod,
    selectedReaderId,
    isSubmitting,
    readersLoading,
    handleConfirm,
  ]);

  const finalizeSuccess = () => {
    if (!completedOrder) return;

    onOrderUpdatedAction(completedOrder);
    if (reopenOrderUrl) router.push(reopenOrderUrl);

    onCloseAction();
  };

  const handleClose = useCallback(async () => {
    if (!completedOrder && order.payment_method !== "in-person") {
      try {
        await updateOrderFields({ payment_method: "in-person" });
        toast.info(dict.in_person_notice, { id: "in-person-notice" });
      } catch (err) {
        console.warn("Failed to set payment method to in-person on close", err);
      }
    }
    onCloseAction();
  }, [
    completedOrder,
    order.payment_method,
    updateOrderFields,
    onCloseAction,
    dict.in_person_notice,
  ]);

  if (!open) return null;

  const paymentNeedsConfirmation =
    paymentMethod === "cash" ||
    paymentMethod === "other" ||
    paymentMethod === "mbway" ||
    paymentMethod === "in-person";
  const confirmationMessage =
    paymentMethod === "in-person"
      ? dict.confirm_in_person
      : paymentMethod === "cash"
        ? dict.confirm_cash
        : paymentMethod === "mbway"
          ? dict.confirm_mbway
          : dict.confirm_reference.replace("{reference}", paymentReference.trim() || "-");

  if (flowState === "processing" || flowState === "success") {
    return (
      <div className={styles.backdrop}>
        <PaymentProcessingSpinner
          flowState={flowState === "success" ? "success" : "processing"}
          title={
            flowState === "success"
              ? dict.success_title
              : paymentMethod === "sumup-tpa"
                ? dict.processing_terminal_title
                : dict.processing_payment_title
          }
          subtitle={
            flowState === "success"
              ? dict.success_subtitle
              : statusMessage || dict.awaiting_subtitle
          }
          size={flowState === "success" ? 56 : 48}
          actionLabel={flowState === "success" ? dict.view_orders : undefined}
          onAction={flowState === "success" ? finalizeSuccess : undefined}
        />
      </div>
    );
  }

  return (
    <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className={styles.modal}>
        <button
          className={styles.closeButton}
          type="button"
          onClick={handleClose}
          aria-label={dict.close_label}>
          <MdClose size={20} />
        </button>

        <h3 className={styles.title}>{title}</h3>

        {error ? <div className={styles.error}>{error}</div> : null}

        <label className={styles.label}>
          {dict.method_label}
          <select
            className={styles.input}
            value={paymentMethod}
            onChange={(e) => {
              const method = e.target.value as PaymentMethod;
              setPaymentMethod(method);
              setError(null);
              if (method === "in-person") {
                toast.info(dict.in_person_notice, { id: "in-person-notice" });
              }
            }}
            disabled={isSubmitting || lockPaymentMethod}>
            {availablePaymentMethods.map((method) => (
              <option key={method} value={method}>
                {getPaymentLabel(method, dict.payment_methods)}
              </option>
            ))}
          </select>
        </label>

        {paymentMethod === "other" && (
          <label className={styles.label}>
            {dict.reference_label}
            <input
              className={styles.input}
              type="text"
              placeholder={dict.reference_placeholder}
              value={paymentReference}
              onChange={(e) => {
                setPaymentReference(e.target.value);
                setError(null);
              }}
              required
              disabled={isSubmitting}
            />
          </label>
        )}
        {paymentMethod === "mbway" && order.payment_method !== "mbway" && (
          <div className={styles.label}>
            {dict.mbway_send_to}{" "}
            <strong>{order.mbway_number || dict.mbway_number_unavailable}</strong>
          </div>
        )}

        {paymentMethod === "sumup-tpa" ? (
          <>
            <label className={styles.label} htmlFor="sumup-reader-select">
              {dict.reader_label}
              {readersLoading ? (
                <span style={{ fontSize: "0.95em", color: "#6b7280", marginLeft: 8 }}>
                  {dict.loading_readers}
                </span>
              ) : null}
            </label>
            <select
              id="sumup-reader-select"
              className={styles.input}
              value={selectedReaderId}
              onChange={(e) => setSelectedReaderId(e.target.value)}
              disabled={readersLoading || isSubmitting}>
              <option value="">{dict.select_reader}</option>
              {readers.map((reader: SumUpReader) => (
                <option key={reader.id} value={reader.id}>
                  {reader.name || reader.id}
                </option>
              ))}
            </select>
          </>
        ) : null}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={handleClose}
            disabled={isSubmitting}>
            {dict.cancel}
          </button>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={() => {
              if (paymentMethod === "other" && !paymentReference.trim()) {
                setError(dict.fill_reference);
                return;
              }
              if (paymentNeedsConfirmation) {
                setShowConfirmDialog(true);
                return;
              }

              void handleConfirm();
            }}
            disabled={isSubmitting || (paymentMethod === "other" && !paymentReference.trim())}>
            {dict.confirm_btn.replace(
              "{method}",
              getPaymentLabel(paymentMethod, dict.payment_methods)
            )}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirmDialog}
        message={confirmationMessage}
        onConfirm={() => {
          setShowConfirmDialog(false);
          void handleConfirm();
        }}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </div>
  );
}
