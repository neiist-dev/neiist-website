"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ShopCheckoutOverlay from "@/components/shop/ShopCheckoutOverlay";
import styles from "@/styles/components/shop/CheckoutForm.module.css";

import { Campus } from "@/types/shop/order";
import { OrderSource } from "@/types/shop/orderKind";
import { getPaymentLabel, PaymentMethod } from "@/types/shop/payment";
import { CartItem } from "@/types/shop/product";
import { getOrderKindRules, getOrderKindFromItems } from "@/utils/shop/orderKindUtils";
import Image from "next/image";
import { getColorFromOptions, isColorKey } from "@/utils/shop/shopUtils";
import { FaChevronDown } from "react-icons/fa";
import { User } from "@/types/user";
import type { ApplePayPaymentRequest, ApplePayPaymentToken } from "@/types/sumup";

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
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [submittedPaymentMethod, setSubmittedPaymentMethod] = useState<PaymentMethod | null>(null);

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

  const total = cart.reduce((sum, item) => sum + unitPrice(item) * item.quantity, 0);
  const subtotal = total / 1.23; // Price without IVA
  const taxes = total - subtotal; // IVA amount (23% of subtotal)
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
      setError("Por favor, seleciona o campus.");
      return;
    }

    if (isMixedInvalid) {
      setError("Este pedido nao pode misturar categorias especiais com outras categorias.");
      return;
    }

    if (!selectedPayment || !allowedPaymentMethods.includes(selectedPayment)) {
      setError("Seleciona um método de pagamento.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createOrder(selectedPayment, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao submeter encomenda.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplePayDirect = () => {
    if (!campus) {
      setError("Por favor, seleciona o campus.");
      return;
    }

    if (typeof window === "undefined" || !window.isSecureContext) {
      setError("Apple Pay requer um contexto seguro (HTTPS).");
      return;
    }

    if (typeof window.ApplePaySession === "undefined") {
      setError("Apple Pay não está disponível neste browser.");
      return;
    }

    const ApplePaySession = window.ApplePaySession;
    if (!ApplePaySession.canMakePayments()) {
      setError("Apple Pay não está disponível neste dispositivo.");
      return;
    }

    setError(null);

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
        setError(
          error instanceof Error ? error.message : "Falha na validação Apple Pay. Tenta novamente."
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
          setError(data?.error || "Pagamento Apple Pay falhou. Tenta novamente.");
        }
      } catch (error) {
        session.completePayment(ApplePaySession.STATUS_FAILURE);
        setError(
          error instanceof Error ? error.message : "Erro ao processar Apple Pay. Tenta novamente."
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

        {/* TODO: remove inline error in favor of toast or test if for this case the inline error on the widget are better.*/}
        {error && <div className={styles.errorMessage}>{error}</div>}
      </div>

      <div className={styles.rightColumn}>
        <div className={styles.summarySticky}>
          <h2 className={styles.summaryTitle}>Resumo da Encomenda</h2>
          <div className={styles.cartItems}>
            {cart.map((item, idx) => {
              const variantObj =
                item.variantId != null
                  ? item.product.variants.find((v) => v.id === item.variantId)
                  : null;

              const imageSrc =
                variantObj && Array.isArray(variantObj.images) && variantObj.images.length > 0
                  ? variantObj.images[0]
                  : item.product.images?.[0];
              const colorInfo = getColorFromOptions(
                variantObj?.options ?? undefined,
                variantObj?.label ?? undefined
              );
              return (
                <div
                  key={`${item.product.id}-${item.variantId ?? "default"}-${idx}`}
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
                      {variantObj?.options &&
                        (() => {
                          const entries = Object.entries(variantObj.options);
                          const nonColorEntries = entries.filter(([k]) => !isColorKey(k));
                          return nonColorEntries.map(([k, v]) => (
                            <span className={styles.variantSize} key={k}>
                              {`${k.trim()}: ${v}`}
                            </span>
                          ));
                        })()}
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
                <div className={styles.priceDivider} />
              </>
            )}
            <div className={styles.totalLine}>
              <span>Total</span>
              <span>€{total.toFixed(2)}</span>
            </div>
          </div>

          <div className={styles.expandableWrapper}>
            <div className={styles.expandSection}>
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
