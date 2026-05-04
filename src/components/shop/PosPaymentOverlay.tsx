"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MdClose } from "react-icons/md";
import { toast } from "sonner";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import { Order } from "@/types/shop/order";
import { PENDING_PAYMENT_METHODS, PaymentMethod } from "@/types/shop/payment";
import { getOrderKindRules, getOrderKindFromItems } from "@/utils/shop/orderKindUtils";
import type { SumUpReader } from "@/types/sumup";
import PaymentProcessingSpinner from "@/components/shop/PaymentProcessingSpinner";
import styles from "@/styles/components/shop/PosPaymentOverlay.module.css";

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
};

type FlowState = "form" | "processing" | "success";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function methodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    cash: "Dinheiro",
    other: "Outro",
    "sumup-tpa": "SumUp TPA",
    sumup: "SumUp Online",
    "apple-pay": "Apple Pay",
    "in-person": "Presencial",
    mbway: "MBWay",
  };
  return labels[method];
}

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

  const selectedReaderName = useMemo(
    () =>
      readers.find((reader) => reader.id === selectedReaderId)?.name ||
      initialReaderName ||
      selectedReaderId,
    [readers, selectedReaderId, initialReaderName]
  );

  const { orderKind } = useMemo(() => getOrderKindFromItems(order.items), [order.items]);

  const availablePaymentMethods = useMemo(
    () =>
      getOrderKindRules(orderKind, "pos").paymentMethods.filter(
        (method): method is Exclude<PaymentMethod, "in-person"> => method !== "in-person"
      ),
    [orderKind]
  );

  const isExistingOrderPaymentFlow = initialPaymentMethod
    ? PENDING_PAYMENT_METHODS.has(initialPaymentMethod)
    : false;
  const title = isExistingOrderPaymentFlow ? "Registar Pagamento" : "Finalizar Encomenda";

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
      .catch((error) => setError(error.message || "Falha ao carregar leitores"))
      .finally(() => setReadersLoading(false));
  }, [open, paymentMethod, initialReaderId]);

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
          (data as { error?: string } | null)?.error || "Falha ao atualizar encomenda"
        );

      return data;
    },
    [order.id]
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
        throw new Error(errorData?.error || "Falha ao finalizar encomenda");
      }

      const data = (await res.json().catch(() => null)) as Order | null;
      if (!data || !("id" in data)) throw new Error("Resposta inválida do servidor");

      return data;
    },
    [order.id]
  );

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
            : "A aguardar confirmação do terminal..."
        );

        await sleep(2500);
      }

      return { paid: false, transactionCode: null };
    },
    [refreshOrder, selectedReaderName]
  );

  const runTpaFlow = useCallback(async (): Promise<Order | null> => {
    if (!selectedReaderId) throw new Error("Seleciona um leitor SumUp para continuar.");

    setStatusMessage("A iniciar pagamento no terminal...");

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
          setStatusMessage("Checkout já iniciado no terminal. A aguardar confirmação...");
          const pollResult = await pollReaderTransactionPaid(existingClientTransactionId);

          if (pollResult.paid) {
            const paymentReference = pollResult.transactionCode || existingClientTransactionId;
            await updateOrderFields({
              payment_method: "sumup-tpa",
              payment_reference: paymentReference,
            });
            const updated = await finalizePaidOrder(paymentReference);
            return updated;
          }

          const pending = await updateOrderFields({
            payment_method: "sumup-tpa",
            payment_reference: existingClientTransactionId,
          });
          toast.info("Pagamento iniciado no terminal. A confirmação pode demorar alguns segundos.");
          return pending;
        }
      }

      const apiError = createData?.error || "Falha ao iniciar no terminal.";
      throw new Error(apiError);
    }

    setStatusMessage("Pagamento enviado para o terminal. A aguardar confirmação...");
    const pollResult = await pollReaderTransactionPaid(createData.clientTransactionId);

    if (pollResult.paid) {
      const paymentReference = pollResult.transactionCode || createData.clientTransactionId;
      await updateOrderFields({
        payment_method: "sumup-tpa",
        payment_reference: paymentReference,
      });
      const updated = await finalizePaidOrder(paymentReference);
      return updated;
    }

    const pending = await updateOrderFields({
      payment_method: "sumup-tpa",
      payment_reference: createData.clientTransactionId,
    });
    toast.info("Pagamento iniciado no terminal. A confirmação pode demorar alguns segundos.");
    return pending;
  }, [
    selectedReaderId,
    order.id,
    refreshOrder,
    pollReaderTransactionPaid,
    updateOrderFields,
    finalizePaidOrder,
  ]);

  const handleConfirm = useCallback(async () => {
    if (confirmInFlightRef.current) return;

    confirmInFlightRef.current = true;
    setError(null);
    setIsSubmitting(true);
    setFlowState("processing");
    setStatusMessage("A processar pagamento...");
    let succeeded = false;

    try {
      let updated: Order | null = null;

      if (paymentMethod === "cash") {
        const ref = "cash";
        await updateOrderFields({ payment_method: "cash", payment_reference: ref });
        updated = await finalizePaidOrder(ref);
      } else if (paymentMethod === "mbway") {
        const ref = "mbway";
        await updateOrderFields({ payment_method: "mbway", payment_reference: ref });
        updated = await finalizePaidOrder(ref);
      } else if (paymentMethod === "other") {
        if (!paymentReference.trim())
          throw new Error("Preenche a referência de pagamento correspondente.");

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
          setStatusMessage("Pagamento confirmado com sucesso.");
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
      setError((error as Error).message || "Falha ao processar pagamento.");
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
    finalizePaidOrder,
    runTpaFlow,
    onOrderUpdatedAction,
    onCloseAction,
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

  const paymentNeedsConfirmation =
    paymentMethod === "cash" || paymentMethod === "other" || paymentMethod === "mbway";
  const confirmationMessage =
    paymentMethod === "cash"
      ? "Confirmas que recebeste o pagamento em dinheiro e está correto?"
      : paymentMethod === "mbway"
        ? "Confirmas que recebeste o pagamento por MBWay e está correto?"
        : `Confirmas que recebeste o pagamento da referência "${paymentReference.trim() || "-"}" e está correto?`;

  if (flowState === "processing" || flowState === "success") {
    return (
      <div className={styles.backdrop}>
        <PaymentProcessingSpinner
          flowState={flowState === "success" ? "success" : "processing"}
          title={
            flowState === "success"
              ? "Encomenda Registada!"
              : paymentMethod === "sumup-tpa"
                ? "A processar no terminal"
                : "A processar pagamento"
          }
          subtitle={
            flowState === "success"
              ? "A tua encomenda foi registada. Pagamento confirmado com sucesso."
              : statusMessage || "A aguardar confirmação..."
          }
          size={flowState === "success" ? 56 : 48}
          actionLabel={flowState === "success" ? "Ver Encomendas" : undefined}
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
          aria-label="Fechar">
          <MdClose size={20} />
        </button>

        <h3 className={styles.title}>{title}</h3>

        {error ? <div className={styles.error}>{error}</div> : null}

        <label className={styles.label}>
          Método de pagamento
          <select
            className={styles.input}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            disabled={isSubmitting || lockPaymentMethod}>
            {availablePaymentMethods.map((method) => (
              <option key={method} value={method}>
                {methodLabel(method)}
              </option>
            ))}
          </select>
        </label>

        {paymentMethod === "other" && (
          <label className={styles.label}>
            Referência de pagamento
            <input
              className={styles.input}
              type="text"
              placeholder="Identifica o meio alternativo de pagamento..."
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              disabled={isSubmitting}
            />
          </label>
        )}
        {paymentMethod === "mbway" && order.payment_method !== "mbway" && (
          <div className={styles.label}>
            Enviar MBWay para: <strong>{order.mbway_number || "Número não disponível"}</strong>
          </div>
        )}

        {paymentMethod === "sumup-tpa" ? (
          <>
            <label className={styles.label} htmlFor="sumup-reader-select">
              Leitor SumUp
              {readersLoading ? (
                <span style={{ fontSize: "0.95em", color: "#6b7280", marginLeft: 8 }}>
                  A carregar leitores…
                </span>
              ) : null}
            </label>
            <select
              id="sumup-reader-select"
              className={styles.input}
              value={selectedReaderId}
              onChange={(e) => setSelectedReaderId(e.target.value)}
              disabled={readersLoading || isSubmitting}>
              <option value="">Seleciona um leitor</option>
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
            Cancelar
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
            Confirmar {methodLabel(paymentMethod)}
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
