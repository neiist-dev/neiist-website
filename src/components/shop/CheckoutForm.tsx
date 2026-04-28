"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ShopCheckoutOverlay from "@/components/shop/ShopCheckoutOverlay";
import styles from "@/styles/components/shop/CheckoutForm.module.css";
import { Campus, type CartItem, type PaymentMethod } from "@/types/shop";
import Image from "next/image";
import { getColorFromOptions, isColorKey } from "@/utils/shopUtils";
import { FaChevronDown } from "react-icons/fa";
import { User } from "@/types/user";
import type { ApplePayPaymentRequest, ApplePayPaymentToken } from "@/types/sumup";

interface CheckoutFormProps {
  user: User;
  dict: {
    empty_cart: string;
    section_personal: string;
    phone_label: string;
    phone_placeholder: string;
    nif_label: string;
    nif_placeholder: string;
    section_delivery: string;
    section_payment: string;
    section_notes: string;
    notes_placeholder: string;
    processing: string;
    submit: string;
    apple_pay_label: string;
    summary_title: string;
    subtotal: string;
    iva: string;
    total: string;
    tax_info: string;
    tax_info_detail: string;
    delivery_estimate: string;
    delivery_detail: string;
    campus_alameda: string;
    campus_taguspark: string;
    payment_card: string;
    payment_in_person: string;
    error_no_campus: string;
    error_no_payment: string;
    error_submit: string;
    error_apple_pay_context: string;
    error_apple_pay_unavailable: string;
    error_apple_pay_device: string;
    error_apple_pay_failed: string;
    error_apple_pay_processing: string;
    error_checkout_create: string;
    error_checkout_unexpected: string;
    error_applepay_validation: string;
    error_payment_incomplete: string;

  };
}

export default function CheckoutForm({ user, dict }: CheckoutFormProps) {
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
      }),
    });

    const data = (await res.json()) as { id?: number; error?: string };
    if (!res.ok || !data?.id) throw new Error(data?.error || dict.error_submit);

    if (persistOverlay) {
      setSubmittedPaymentMethod(selectedPayment);
      setOrderId(data.id);
    }

    return data.id;
  };

  const handleSubmit = async (selectedPayment: PaymentMethod | null = payment) => {
    if (!campus) {
      // TODO: (ERROR)
      setError(dict.error_no_campus);
      return;
    }
    if (selectedPayment !== "sumup" && selectedPayment !== "in-person") {
      // TODO: (ERROR)
      setError(dict.error_no_payment);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createOrder(selectedPayment, true);
    } catch (err) {
      // TODO: (ERROR)
      setError(err instanceof Error ? err.message : dict.error_submit);
    } finally {
      setLoading(false);
    }
  };

  const handleApplePayDirect = () => {
    if (!campus) {
      // TODO: (ERROR)
      setError(dict.error_no_campus);
      return;
    }

    if (typeof window === "undefined" || !window.isSecureContext) {
      // TODO: (ERROR)
      setError(dict.error_apple_pay_context);
      return;
    }

    if (typeof window.ApplePaySession === "undefined") {
      // TODO: (ERROR)
      setError(dict.error_apple_pay_unavailable);
      return;
    }

    const ApplePaySession = window.ApplePaySession;
    if (!ApplePaySession.canMakePayments()) {
      setError(dict.error_apple_pay_device);
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
            checkoutData?.error || checkoutData?.message || dict.error_checkout_create
          );

        checkoutId = checkoutData.checkoutId ?? checkoutData.id ?? null;
        if (!checkoutId) throw new Error(dict.error_checkout_unexpected);

        const merchantRes = await fetch("/api/shop/sumup/apple-pay-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkoutId, validationUrl: event.validationURL }),
        });
        if (!merchantRes.ok) throw new Error(dict.error_applepay_validation);

        const merchantSession = (await merchantRes.json()) as unknown;
        session.completeMerchantValidation(merchantSession);
      } catch (error) {
        session.abort();
        setError(
          error instanceof Error ? error.message : dict.error_apple_pay_failed
        );
        setLoading(false);
      }
    };

    session.onpaymentauthorized = async (event) => {
      try {
        if (!checkoutId || !createdOrderId) throw new Error(dict.error_payment_incomplete);

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
          // TODO: (ERROR)
          setError(data?.error || dict.error_apple_pay_failed);
        }
      } catch (error) {
        session.completePayment(ApplePaySession.STATUS_FAILURE);
        // TODO: (ERROR)
        setError(
          error instanceof Error ? error.message : dict.error_apple_pay_processing
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
        <p>{dict.empty_cart}</p>
      </div>
    );
  }

  const pickupOptions = [
    { id: Campus._Alameda, label: dict.campus_alameda },
    { id: Campus._Taguspark, label: dict.campus_taguspark },
  ] as const;

  const paymentOptions = [
    { id: "sumup", label: dict.payment_card },
    { id: "in-person", label: dict.payment_in_person },
  ] as const;
  const selectedStandardPayment = payment === "sumup" || payment === "in-person";

  return (
    <div className={styles.container}>
      <div className={styles.leftColumn}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{dict.section_personal}</h2>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>{dict.phone_label}</label>
              <div className={styles.inputWithIcon}>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={dict.phone_placeholder}
                  className={styles.input}
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>{dict.nif_label}</label>
              <input
                type="text"
                value={nif}
                onChange={(e) => setNif(e.target.value)}
                placeholder={dict.nif_placeholder}
                className={styles.input}
              />
            </div>
          </div>
        </section>

        <div className={styles.divider} />
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{dict.section_delivery}</h2>

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
          <h2 className={styles.sectionTitle}>{dict.section_payment}</h2>

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
          <h2 className={styles.sectionTitle}>{dict.section_notes}</h2>
          <textarea
            className={styles.textarea}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={dict.notes_placeholder}
            rows={4}
          />
        </section>
        {selectedStandardPayment && (
          <button
            className={styles.checkoutButton}
            onClick={() => handleSubmit()}
            disabled={loading}>
            {loading ? dict.processing : dict.submit}
          </button>
        )}

        {applePayAvailable && payment !== "in-person" && payment !== "sumup" && (
          <button
            className={styles.applePayStandaloneButton}
            onClick={handleApplePayDirect}
            disabled={loading}
            aria-label={dict.apple_pay_label}></button>
        )}

        {/* TODO: remove inline error in favor of toast or test if for this case the inline error on the widget are better.*/}
        {error && <div className={styles.errorMessage}>{error}</div>}
      </div>

      <div className={styles.rightColumn}>
        <div className={styles.summarySticky}>
          <h2 className={styles.summaryTitle}>{dict.summary_title}</h2>
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
            <div className={styles.priceLine}>
              <span>{dict.subtotal}</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>
            <div className={styles.priceLine}>
              <span>{dict.iva}</span>
              <span>€{taxes.toFixed(2)}</span>
            </div>
            <div className={styles.priceDivider} />
            <div className={styles.totalLine}>
              <span>{dict.total}</span>
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
                  {dict.tax_info}
                </span>
                <FaChevronDown
                  className={`${styles.expandIcon} ${showTaxInfo ? styles.expanded : ""}`}
                />
              </button>
              {showTaxInfo && (
                <div className={styles.expandContent}>
                  {dict.tax_info_detail}
                </div>
              )}
            </div>
            <div className={styles.expandSection}>
              <button
                className={styles.expandButton}
                onClick={() => setShowDeliveryInfo((v) => !v)}
                aria-expanded={showDeliveryInfo}>
                <span className={styles.expandText}>{dict.delivery_estimate}</span>
                <FaChevronDown
                  className={`${styles.expandIcon} ${showDeliveryInfo ? styles.expanded : ""}`}
                />
              </button>
              {showDeliveryInfo && (
                <div className={styles.expandContent}>
                  {dict.delivery_detail}
                </div>
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
