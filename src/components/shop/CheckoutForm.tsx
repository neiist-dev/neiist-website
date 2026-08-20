"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ShopCheckoutOverlay from "@/components/shop/ShopCheckoutOverlay";
import { toast } from "sonner";
import styles from "@/styles/components/shop/CheckoutForm.module.css";

import { Campus } from "@/types/shop/order";
import { OrderSource } from "@/types/shop/orderKind";
import { getPaymentLabel, PaymentMethod } from "@/types/shop/payment";
import { CartItem } from "@/types/shop/product";
import { getOrderKindRules, getOrderKindFromItems } from "@/utils/shop/orderKindUtils";
import Image from "next/image";
import { getColorFromOptions } from "@/utils/shop/shopUtils";
import { FaChevronDown } from "react-icons/fa";
import { User } from "@/types/user";
import type { ApplePayPaymentRequest, ApplePayPaymentToken } from "@/types/sumup";
import VariantTags from "@/components/shop/VariantTags";
import { validateDiscount } from "@/utils/shop/discountUtils";

interface CheckoutFormProps {
  user: User;
}

export default function CheckoutForm({ user }: CheckoutFormProps) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [campus, setCampus] = useState<Campus>(Campus._Alameda);
  const [payment, setPayment] = useState<PaymentMethod | null>(null);
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [showTaxInfo, setShowTaxInfo] = useState(false);
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [submittedPaymentMethod, setSubmittedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    discount_amount: number;
  } | null>(null);
  const [discountLoading, setDiscountLoading] = useState(false);

  const [phone, setPhone] = useState(user.phone || "");
  const [nif, setNif] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem("cart") || "[]";
        setCart(JSON.parse(raw));
      } catch {
        setCart([]);
      }
    };
    load();
    window.addEventListener("cartUpdated", load);
    return () => window.removeEventListener("cartUpdated", load);
  }, []);

  useEffect(() => {
    setAppliedDiscount(null);
  }, [cart]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.isSecureContext) return;
    if (typeof window.ApplePaySession === "undefined") return;
    try {
      setApplePayAvailable(window.ApplePaySession.canMakePayments());
    } catch {
      setApplePayAvailable(false);
    }
  }, []);

  const unitPrice = (item: CartItem) => {
    const variantModifier =
      item.variantId != null
        ? (item.product.variants.find((v) => v.id === item.variantId)?.price_modifier ?? 0)
        : 0;
    return item.product.price + variantModifier;
  };

  const cartTotal = cart.reduce((sum, item) => sum + unitPrice(item) * item.quantity, 0);
  const discountAmount = appliedDiscount?.discount_amount ?? 0;
  const total = Math.max(cartTotal - discountAmount, 0);
  const subtotal = cartTotal / 1.23; // Price without IVA
  const taxes = cartTotal - subtotal; // IVA amount (23% of subtotal)
  const { orderKind: checkoutOrderKind, isMixedInvalid } = getOrderKindFromItems(
    cart.map((item) => item.product)
  );
  const isSpecialOrderKind = checkoutOrderKind !== "normal";
  const checkoutSource: OrderSource = checkoutOrderKind === "jantar_de_curso" ? "dinner" : "other";
  const orderRules = getOrderKindRules(checkoutOrderKind, checkoutSource);
  const allowedPaymentMethods = orderRules.paymentMethods;

  const apiItems = cart.map((item) => ({
    product_id: item.product.id,
    variant_id: item.variantId ?? undefined,
    quantity: item.quantity,
  }));

  const handleApplyDiscount = async () => {
    const code = discountCode.trim();
    if (!code) {
      setAppliedDiscount(null);
      toast.error("Indica um código de desconto.", { closeButton: true });
      return;
    }

    setDiscountLoading(true);
    try {
      const result = await validateDiscount({
        code,
        userIstid: user.istid,
        cartItems: apiItems,
      });

      if (!result.valid) {
        setAppliedDiscount(null);
        toast.error(result.error ?? "Código de desconto inválido.", { closeButton: true });
        return;
      }

      setAppliedDiscount({
        code: result.code ?? code,
        discount_amount: Number(result.discount_amount ?? 0),
      });
    } catch (err) {
      setAppliedDiscount(null);
      toast.error(err instanceof Error ? err.message : "Não foi possível validar o código.", {
        closeButton: true,
      });
    } finally {
      setDiscountLoading(false);
    }
  };

  const createOrder = async (selectedPayment: PaymentMethod, persistOverlay = true) => {
    const res = await fetch("/api/shop/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_istid: user.istid,
        customer_name: user.name,
        customer_email: user.email,
        items: apiItems,
        campus,
        customer_nif: nif || undefined,
        notes: notes || undefined,
        payment_method: selectedPayment,
        payment_reference: undefined,
        customer_phone: user.phone || phone || undefined,
        order_source: checkoutSource,
        discount_code: appliedDiscount?.code ?? undefined,
      }),
    });

    const data = (await res.json()) as { id?: number; error?: string };
    if (!res.ok || !data?.id) throw new Error(data?.error || "Erro ao submeter encomenda.");

    if (persistOverlay) {
      setSubmittedPaymentMethod(selectedPayment);
      setOrderId(data.id);
    }

    return data.id;
  };

  const handleSubmit = async (selectedPayment: PaymentMethod | null = payment) => {
    if (!campus) {
      toast.error("Por favor, seleciona o campus.", { closeButton: true });
      return;
    }

    if (isMixedInvalid) {
      toast.error("Este pedido não pode misturar categorias especiais com outras categorias.", {
        closeButton: true,
      });
      return;
    }

    if (!selectedPayment || !allowedPaymentMethods.includes(selectedPayment)) {
      toast.error("Seleciona um método de pagamento.", { closeButton: true });
      return;
    }
    setLoading(true);
    try {
      await createOrder(selectedPayment, true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao submeter encomenda.", {
        closeButton: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplePayDirect = () => {
    if (!campus) {
      toast.error("Por favor, seleciona o campus.", { closeButton: true });
      return;
    }

    if (typeof window === "undefined" || !window.isSecureContext) {
      toast.error("Apple Pay requer um contexto seguro (HTTPS).", { closeButton: true });
      return;
    }

    if (typeof window.ApplePaySession === "undefined") {
      toast.error("Apple Pay não está disponível neste browser.", { closeButton: true });
      return;
    }

    const ApplePaySession = window.ApplePaySession;
    if (!ApplePaySession.canMakePayments()) {
      toast.error("Apple Pay não está disponível neste dispositivo.", { closeButton: true });
      return;
    }

    let createdOrderId: number | null = null;
    let checkoutId: string | null = null;

    const request: ApplePayPaymentRequest = {
      currencyCode: "EUR",
      countryCode: "PT",
      merchantCapabilities: ["supports3DS"],
      supportedNetworks: ["masterCard", "visa"],
      total: {
        label: "NEIIST",
        amount: total.toFixed(2),
        type: "final",
      },
    };

    const session = new ApplePaySession(3, request);

    session.onvalidatemerchant = async (event) => {
      try {
        setLoading(true);

        createdOrderId = await createOrder("apple-pay", false);

        const checkoutRes = await fetch("/api/shop/sumup/new", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: createdOrderId,
            currency: "EUR",
            checkout_reference: `order-${createdOrderId}`,
          }),
        });
        const checkoutData = (await checkoutRes.json()) as {
          checkoutId?: string;
          id?: string;
          error?: string;
          message?: string;
        };
        if (!checkoutRes.ok)
          throw new Error(
            checkoutData?.error || checkoutData?.message || "Falha ao criar checkout"
          );

        checkoutId = checkoutData.checkoutId ?? checkoutData.id ?? null;
        if (!checkoutId) throw new Error("Resposta inesperada do serviço de pagamento");

        const merchantRes = await fetch("/api/shop/sumup/apple-pay-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkoutId, validationUrl: event.validationURL }),
        });
        if (!merchantRes.ok) throw new Error("Falha na validação Apple Pay");

        const merchantSession = (await merchantRes.json()) as unknown;
        session.completeMerchantValidation(merchantSession);
      } catch (error) {
        session.abort();
        toast.error(
          error instanceof Error ? error.message : "Falha na validação Apple Pay. Tenta novamente.",
          { closeButton: true }
        );
        setLoading(false);
      }
    };

    session.onpaymentauthorized = async (event) => {
      try {
        if (!checkoutId || !createdOrderId) throw new Error("Dados de pagamento incompletos");

        const res = await fetch("/api/shop/sumup/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checkoutId,
            orderId: createdOrderId,
            applePayToken: event.payment.token as ApplePayPaymentToken,
          }),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };

        if (res.ok && data?.ok) {
          session.completePayment(ApplePaySession.STATUS_SUCCESS);
          localStorage.setItem("cart", "[]");
          window.dispatchEvent(new Event("cartUpdated"));
          router.push(`/my-orders?orderId=${createdOrderId}`);
        } else {
          session.completePayment(ApplePaySession.STATUS_FAILURE);
          toast.error(data?.error || "Pagamento Apple Pay falhou. Tenta novamente.", {
            closeButton: true,
          });
        }
      } catch (error) {
        session.completePayment(ApplePaySession.STATUS_FAILURE);
        toast.error(
          error instanceof Error ? error.message : "Erro ao processar Apple Pay. Tenta novamente.",
          { closeButton: true }
        );
      } finally {
        setLoading(false);
      }
    };

    session.oncancel = () => {
      setLoading(false);
    };

    session.begin();
  };

  if (cart.length === 0 && !orderId) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
        <p>O teu carrinho está vazio.</p>
      </div>
    );
  }

  const pickupOptions = [
    { id: Campus._Alameda, label: "Alameda" },
    { id: Campus._Taguspark, label: "Taguspark" },
  ] as const;

  const paymentOptions = allowedPaymentMethods.map((method) => ({
    id: method,
    label: getPaymentLabel(method),
  }));
  const isSelectedPaymentAllowed = payment !== null && allowedPaymentMethods.includes(payment);
  const hasSelectedPayMethod = payment !== null && payment !== "apple-pay";
  const isApplePayAllowed = applePayAvailable && allowedPaymentMethods.includes("apple-pay");
  const showApplePay = isApplePayAllowed && !hasSelectedPayMethod;

  return (
    <div className={styles.container}>
      <div className={styles.leftColumn}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>1. Informações Pessoais</h2>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Número de Telefone</label>
              <div className={styles.inputWithIcon}>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+351 999 888 777"
                  className={styles.input}
                />
              </div>
            </div>
            {!isSpecialOrderKind && (
              <div className={styles.formGroup}>
                <label>NIF (Opcional)</label>
                <input
                  type="text"
                  value={nif}
                  onChange={(e) => setNif(e.target.value)}
                  placeholder="123456789"
                  className={styles.input}
                />
              </div>
            )}
          </div>
        </section>

        <div className={styles.divider} />
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {isSpecialOrderKind ? "2. Campus" : "2. Local de Entrega"}
          </h2>

          <div className={styles.radioGroup}>
            {pickupOptions.map((opt) => (
              <label key={opt.id} className={styles.radioOption}>
                <input
                  type="radio"
                  name="campus"
                  checked={campus === opt.id}
                  onChange={() => setCampus(opt.id)}
                  className={styles.radioInput}
                  required
                />
                <span className={styles.radioLabel}>{opt.label}</span>
              </label>
            ))}
          </div>
        </section>

        <div className={styles.divider} />

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Método de Pagamento</h2>

          <div className={styles.radioGroup}>
            {paymentOptions.map((opt) => (
              <label key={opt.id} className={styles.radioOption}>
                <input
                  type="radio"
                  name="payment"
                  checked={payment === opt.id}
                  onChange={() => setPayment(opt.id as PaymentMethod)}
                  onClick={() => {
                    if (payment === opt.id) {
                      setPayment(null);
                    }
                  }}
                  className={styles.radioInput}
                />
                <span className={styles.radioLabel}>{opt.label}</span>
              </label>
            ))}
          </div>
        </section>

        <div className={styles.divider} />
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Notas (Opcional)</h2>
          <textarea
            className={styles.textarea}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Adicione notas sobre a sua encomenda..."
            rows={4}
          />
        </section>

        <section className={styles.section}>
          <div className={styles.formGroup}>
            <label htmlFor="discount-code">Código de desconto</label>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <input
                id="discount-code"
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                placeholder="NEIIST20"
                className={styles.input}
              />
              <button
                type="button"
                className={styles.checkoutButton}
                style={{ marginTop: 0, padding: "0.75rem 1rem", width: "auto" }}
                onClick={handleApplyDiscount}
                disabled={discountLoading || cart.length === 0}>
                {discountLoading ? "A validar..." : "Aplicar"}
              </button>
            </div>
          </div>
        </section>

        {isSelectedPaymentAllowed && (
          <button
            className={styles.checkoutButton}
            onClick={() => handleSubmit()}
            disabled={loading}>
            {loading ? "A processar..." : "Finalizar Compra"}
          </button>
        )}

        {showApplePay && (
          <button
            className={styles.applePayStandaloneButton}
            onClick={handleApplePayDirect}
            disabled={loading}
            aria-label="Pagar com Apple Pay"></button>
        )}
      </div>

      <div className={styles.rightColumn}>
        <div className={styles.summarySticky}>
          <h2 className={styles.summaryTitle}>Resumo da Encomenda</h2>
          <div className={styles.cartItems}>
            {cart.map((item) => {
              const variantObj =
                item.variantId != null
                  ? item.product.variants.find((v) => v.id === item.variantId)
                  : null;

              const imageSrc = variantObj?.images?.[0] ?? item.product.images?.[0];
              const colorInfo = getColorFromOptions(
                variantObj?.options ?? undefined,
                variantObj?.label ?? undefined
              );
              return (
                <div
                  key={`${item.product.id}-${item.variantId ?? "default"}`}
                  className={styles.cartItem}>
                  <div className={styles.productImage}>
                    {imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt={item.product.name}
                        width={80}
                        height={80}
                        className={styles.productImg}
                      />
                    ) : (
                      <div className={styles.placeholderImage} />
                    )}
                  </div>
                  <div className={styles.productDetails}>
                    <div className={styles.productHeader}>
                      <h3>{item.product.name}</h3>
                      <span className={styles.productPrice}>
                        €{unitPrice(item).toFixed(2)} x {item.quantity}
                      </span>
                    </div>
                    <div className={styles.variantInfo}>
                      {colorInfo.hex && (
                        <span
                          className={styles.colorDot}
                          style={{ backgroundColor: colorInfo.hex }}
                          title={colorInfo.name || colorInfo.hex}
                        />
                      )}
                      <VariantTags options={variantObj?.options} className={styles.variantSize} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.pricingSummary}>
            {!isSpecialOrderKind && (
              <>
                <div className={styles.priceLine}>
                  <span>Subtotal</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className={styles.priceLine}>
                  <span>IVA (23%)</span>
                  <span>€{taxes.toFixed(2)}</span>
                </div>
              </>
            )}
            {appliedDiscount && discountAmount > 0 && (
              <div className={styles.priceLine}>
                <span>Desconto aplicado ({appliedDiscount.code})</span>
                <span>- €{discountAmount.toFixed(2)}</span>
              </div>
            )}
            {(!isSpecialOrderKind || (appliedDiscount && discountAmount > 0)) && (
              <div className={styles.priceDivider} />
            )}
            <div className={styles.totalLine}>
              <span>Total</span>
              <span>€{total.toFixed(2)}</span>
            </div>
          </div>

          <div className={styles.expandableWrapper}>
            <div className={styles.expandSection}>
              {!isSpecialOrderKind && (
                <>
                  <button
                    className={styles.expandButton}
                    onClick={() => setShowTaxInfo((v) => !v)}
                    aria-expanded={showTaxInfo}>
                    <span className={styles.expandText}>
                      Taxas incluídas. Entrega calculada no checkout.
                    </span>
                    <FaChevronDown
                      className={`${styles.expandIcon} ${showTaxInfo ? styles.expanded : ""}`}
                    />
                  </button>
                  {showTaxInfo && (
                    <div className={styles.expandContent}>
                      As taxas são calculadas automaticamente com base na sua localização.
                    </div>
                  )}
                </>
              )}
            </div>
            <div className={styles.expandSection}>
              {!isSpecialOrderKind && (
                <>
                  <button
                    className={styles.expandButton}
                    onClick={() => setShowDeliveryInfo((v) => !v)}
                    aria-expanded={showDeliveryInfo}>
                    <span className={styles.expandText}>Entrega estimada: 15-20 dias úteis</span>
                    <FaChevronDown
                      className={`${styles.expandIcon} ${showDeliveryInfo ? styles.expanded : ""}`}
                    />
                  </button>
                  {showDeliveryInfo && (
                    <div className={styles.expandContent}>
                      O prazo de entrega pode variar conforme o local de levantamento escolhido.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {orderId !== null && submittedPaymentMethod && (
        <ShopCheckoutOverlay orderId={orderId} paymentMethod={submittedPaymentMethod} />
      )}
    </div>
  );
}
