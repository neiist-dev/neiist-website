"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MdClose } from "react-icons/md";
import { toast } from "sonner";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import type { Order, PaymentMethod } from "@/types/shop";
import type { SumUpReader } from "@/types/sumup";
import PaymentProcessingSpinner from "@/components/shop/PaymentProcessingSpinner";
import styles from "@/styles/components/shop/PosPaymentOverlay.module.css";

export interface PosPaymentDict {
  close_label: string;
  title: string;
  method_label: string;
  method_cash: string;
  method_other: string;
  method_sumup_tpa: string;
  method_sumup: string;
  method_apple_pay: string;
  method_in_person: string;
  reference_label: string;
  reference_placeholder: string;
  reader_label: string;
  loading_readers: string;
  select_reader: string;
  cancel: string;
  confirm_btn: string;
  success_title: string;
  processing_terminal_title: string;
  processing_payment_title: string;
  success_subtitle: string;
  awaiting_subtitle: string;
  view_orders: string;
  error_load_readers: string;
  error_update_order: string;
  error_mark_paid: string;
  awaiting_terminal: string;
  select_reader_error: string;
  starting_payment: string;
  checkout_started: string;
  payment_initiated_toast: string;
  failed_terminal: string;
  payment_sent: string;
  processing_payment: string;
  fill_reference: string;
  payment_confirmed: string;
  error_payment: string;
  confirm_cash: string;
  confirm_reference: string;
}

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
  dict: {
    pos_payment: PosPaymentDict;
    confirm_dialog: { confirm: string; cancel: string };
  };
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
  const d = dict.pos_payment;
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

  const methodLabel = (method: PaymentMethod): string => {
    const labels: Record<PaymentMethod, string> = {
      cash: d.method_cash,
      other: d.method_other,
      "sumup-tpa": d.method_sumup_tpa,
      sumup: d.method_sumup,
      "apple-pay": d.method_apple_pay,
      "in-person": d.method_in_person,
    };
    return labels[method];
  };

  const selectedReaderName = useMemo(
    () =>
      readers.find((reader) => reader.id === selectedReaderId)?.name ||
      initialReaderName ||
      selectedReaderId,
    [readers, selectedReaderId, initialReaderName]
  );

  useEffect(() => {
    if (!open || paymentMethod !== "sumup-tpa") return;

    setReadersLoading(true);
    setError(null);

    fetch("/api/shop/sumup/readers", { cache: "no-store" })
      .then((response) => response.json())
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
      .catch((error) => setError(error.message || d.error_load_readers))
      .finally(() => setReadersLoading(false));
  }, [open, paymentMethod, initialReaderId, d.error_load_readers]);

  useEffect(() => {
    if (!open) return;

    autoStartedRef.current = false;
    setPaymentMethod(initialPaymentMethod ?? "cash");
    setSelectedReaderId(initialReaderId ?? "");
    setError(null);
    setStatusMessage("");
    setFlowState("form");
    setCompletedOrder(null);
    setShowConfirmDialog(false);
  }, [open, initialPaymentMethod, initialReaderId]);

  // Reset selectedReaderId when payment method changes to sumup-tpa
  useEffect(() => {
    if (!open) return;

    if (paymentMethod === "sumup-tpa") {
      setSelectedReaderId("");
    }
  }, [paymentMethod, open]);

  const refreshOrder = useCallback(async (): Promise<Order | null> => {
    const res = await fetch(`/api/shop/orders/${order.id}`, { cache: "no-store" });
    if (!res.ok) return null;

    const data = (await res.json().catch(() => null)) as Order | null;
    return data;
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
        throw new Error(
          (data as { error?: string } | null)?.error || d.error_update_order
        );

      return data;
    },
    [order.id, d.error_update_order]
  );

  const markOrderAsPaid = useCallback(async (): Promise<Order> => {
    const res = await fetch(`/api/shop/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" }),
    });

    const data = (await res.json().catch(() => null)) as { error?: string } | Order | null;
    if (!res.ok || !data || !("id" in data))
      throw new Error(
        (data as { error?: string } | null)?.error || d.error_mark_paid
      );

    return data;
  }, [order.id, d.error_mark_paid]);

  const pollReaderTransactionPaid = useCallback(
    async (
      clientTransactionId: string
    ): Promise<{ paid: boolean; transactionCode: string | null }> => {
      const startedAt = Date.now();

      while (Date.now() - startedAt < 90_000) {
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
            ? `Leitor ${selectedReaderName}: ${String(txData.status).toLowerCase()}`
            : d.awaiting_terminal
        );

        await sleep(2500);
      }

      return { paid: false, transactionCode: null };
    },
    [refreshOrder, selectedReaderName, d.awaiting_terminal]
  );

  const runTpaFlow = useCallback(async (): Promise<Order | null> => {
    if (!selectedReaderId) throw new Error(d.select_reader_error);

    setStatusMessage(d.starting_payment);

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
          setStatusMessage(d.checkout_started);
          const pollResult = await pollReaderTransactionPaid(existingClientTransactionId);

          if (pollResult.paid) {
            const paymentReference = pollResult.transactionCode || existingClientTransactionId;
            await updateOrderFields({
              payment_method: "sumup-tpa",
              payment_reference: paymentReference,
            });
            const updated = await markOrderAsPaid();
            return updated;
          }

          const pending = await updateOrderFields({
            payment_method: "sumup-tpa",
            payment_reference: existingClientTransactionId,
          });
          toast.info(d.payment_initiated_toast);
          return pending;
        }
      }

      const apiError = createData?.error || d.failed_terminal;
      throw new Error(apiError);
    }

    setStatusMessage(d.payment_sent);
    const pollResult = await pollReaderTransactionPaid(createData.clientTransactionId);

    if (pollResult.paid) {
      const paymentReference = pollResult.transactionCode || createData.clientTransactionId;
      await updateOrderFields({
        payment_method: "sumup-tpa",
        payment_reference: paymentReference,
      });
      const updated = await markOrderAsPaid();
      return updated;
    }

    const pending = await updateOrderFields({
      payment_method: "sumup-tpa",
      payment_reference: createData.clientTransactionId,
    });
    toast.info(d.payment_initiated_toast);
    return pending;
  }, [
    selectedReaderId,
    order.id,
    refreshOrder,
    pollReaderTransactionPaid,
    updateOrderFields,
    markOrderAsPaid,
    d,
  ]);

  const handleConfirm = useCallback(async () => {
    if (confirmInFlightRef.current) return;

    confirmInFlightRef.current = true;
    setError(null);
    setIsSubmitting(true);
    setFlowState("processing");
    setStatusMessage(d.processing_payment);
    let succeeded = false;

    try {
      let updated: Order | null = null;

      if (paymentMethod === "cash") {
        await updateOrderFields({ payment_method: "cash", payment_reference: "" });
        updated = await markOrderAsPaid();
      } else if (paymentMethod === "other") {
        if (!paymentReference.trim())
          throw new Error(d.fill_reference);

        await updateOrderFields({
          payment_method: "other",
          payment_reference: paymentReference.trim(),
        });
        updated = await markOrderAsPaid();
      } else if (paymentMethod === "sumup-tpa") {
        updated = await runTpaFlow();
      }

      if (updated) {
        if (["paid", "ready", "delivered"].includes(updated.status)) {
          setCompletedOrder(updated);
          setStatusMessage(d.payment_confirmed);
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
      setError((error as Error).message || d.error_payment);
      setFlowState("form");
    } finally {
      setIsSubmitting(false);
      confirmInFlightRef.current = false;
      if (!succeeded) setStatusMessage("");
    }
  }, [
    paymentMethod,
    paymentReference,
    updateOrderFields,
    markOrderAsPaid,
    runTpaFlow,
    onOrderUpdatedAction,
    onCloseAction,
    d,
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

  if (!open) return null;

  const paymentNeedsConfirmation = paymentMethod === "cash" || paymentMethod === "other";
  const confirmationMessage =
    paymentMethod === "cash"
      ? d.confirm_cash
      : d.confirm_reference.replace("{reference}", paymentReference.trim() || "-");

  if (flowState === "processing" || flowState === "success") {
    return (
      <div className={styles.backdrop}>
        <PaymentProcessingSpinner
          flowState={flowState === "success" ? "success" : "processing"}
          title={
            flowState === "success"
              ? d.success_title
              : paymentMethod === "sumup-tpa"
                ? d.processing_terminal_title
                : d.processing_payment_title
          }
          subtitle={
            flowState === "success"
              ? d.success_subtitle
              : statusMessage || d.awaiting_subtitle
          }
          size={flowState === "success" ? 56 : 48}
          actionLabel={flowState === "success" ? d.view_orders : undefined}
          onAction={flowState === "success" ? finalizeSuccess : undefined}
        />
      </div>
    );
  }

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => e.target === e.currentTarget && onCloseAction()}>
      <div className={styles.modal}>
        <button
          className={styles.closeButton}
          type="button"
          onClick={onCloseAction}
          aria-label={d.close_label}>
          <MdClose size={20} />
        </button>

        <h3 className={styles.title}>{d.title.replace("{number}", order.order_number)}</h3>

        {error ? <div className={styles.error}>{error}</div> : null}

        <label className={styles.label}>
          {d.method_label}
          <select
            className={styles.input}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            disabled={isSubmitting || lockPaymentMethod}>
            <option value="cash">{methodLabel("cash")}</option>
            <option value="other">{methodLabel("other")}</option>
            <option value="sumup-tpa">{methodLabel("sumup-tpa")}</option>
          </select>
        </label>

        {paymentMethod === "other" ? (
          <label className={styles.label}>
            {d.reference_label}
            <input
              className={styles.input}
              type="text"
              placeholder={d.reference_placeholder}
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              disabled={isSubmitting}
            />
          </label>
        ) : null}

        {paymentMethod === "sumup-tpa" ? (
          <>
            <label className={styles.label} htmlFor="sumup-reader-select">
              {d.reader_label}
              {readersLoading ? (
                <span style={{ fontSize: "0.95em", color: "#6b7280", marginLeft: 8 }}>
                  {d.loading_readers}
                </span>
              ) : null}
            </label>
            <select
              id="sumup-reader-select"
              className={styles.input}
              value={selectedReaderId}
              onChange={(e) => setSelectedReaderId(e.target.value)}
              disabled={readersLoading || isSubmitting}>
              <option value="">{d.select_reader}</option>
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
            onClick={onCloseAction}
            disabled={isSubmitting}>
            {d.cancel}
          </button>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={() => {
              if (paymentNeedsConfirmation) {
                setShowConfirmDialog(true);
                return;
              }

              void handleConfirm();
            }}
            disabled={isSubmitting}>
            {d.confirm_btn.replace("{method}", methodLabel(paymentMethod))}
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
        dict={dict.confirm_dialog}
      />
    </div>
  );
}
