"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ShopCheckoutOverlay from "@/components/shop/checkout/ShopCheckoutOverlay";
import { Alert } from "@neiist/ui";
import styles from "@/styles/components/shop/checkout/CheckoutForm.module.css";

import { Campus, OrderSource } from "@/types/shop/order";
import {
  CheckoutChoice,
  PaymentMethod,
  RESERVATION,
  ONLINE_PAYMENT_METHODS,
} from "@/types/shop/payment";
import { CartItem } from "@/types/shop/product";
import Image from "next/image";
import {
  getColorFromOptions,
  findItemVariant,
  getItemImage,
  getLocalizedPaymentMethods,
} from "@/utils/shop/shopUtils";
import { FaChevronDown } from "react-icons/fa";
import { User } from "@/types/user";
import type {
  ApplePayPaymentRequest,
  ApplePayPaymentToken,
  CreateCheckoutResponse,
  VerifyCheckoutResponse,
} from "@/types/shop/sumup";
import VariantTags from "@/components/shop/VariantTags";
import { validateDiscount } from "@/utils/shop/discountUtils";
import {
  unitPriceMoney,
  lineTotalMoney,
  addMoney,
  subtractMoney,
  toCents,
  fromCents,
  formatMoney,
} from "@/utils/shop/moneyUtils";
import type { Dictionary } from "@/i18n/dictionaries";

interface CheckoutFormProps {
  user: User;
  dict: Dictionary["checkout_form"];
  pendingPaymentDict: Dictionary["pending_payment"];
  checkoutOverlayDict: Dictionary["checkout_overlay"];
  paymentsDict: Dictionary["payments"];
  basePath?: string;
}

export default function CheckoutForm({
  user,
  dict,
  pendingPaymentDict,
  checkoutOverlayDict,
  paymentsDict,
  basePath,
}: CheckoutFormProps) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [campus, setCampus] = useState<Campus>(Campus._Alameda);
  const [payment, setPayment] = useState<CheckoutChoice | null>(null);
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [showTaxInfo, setShowTaxInfo] = useState(false);
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
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
    return unitPriceMoney(item.product.price, variantModifier);
  };

  const cartTotal = cart.reduce(
    (sum, item) => addMoney(sum, lineTotalMoney(unitPrice(item), 0, item.quantity)),
    0
  );
  const discountAmount = appliedDiscount?.discount_amount ?? 0;
  const total = Math.max(subtractMoney(cartTotal, discountAmount), 0);
  const subtotal = fromCents(Math.round(toCents(cartTotal) / 1.23)); // Price without IVA
  const taxes = subtractMoney(cartTotal, subtotal); // IVA amount (23% of subtotal)
  const hasTickets = cart.some((item) => item.product.product_type === "event_ticket");
  const hasMerchandise = cart.some((item) => item.product.product_type !== "event_ticket");
  const isMixedInvalid = hasTickets && hasMerchandise;
  const isSpecialOrderKind = hasTickets;
  const checkoutSource: OrderSource = "web";

  const apiItems = cart.map((item) => ({
    product_id: item.product.id,
    variant_id: item.variantId ?? undefined,
    quantity: item.quantity,
  }));

  const handleApplyDiscount = async () => {
    const code = discountCode.trim();
    if (!code) {
      setAppliedDiscount(null);
      Alert.error(paymentsDict.discount_enter);
      return;
    }

    setDiscountLoading(true);
    try {
      const result = await validateDiscount({ code, cartItems: apiItems });

      if (!result.valid) {
        setAppliedDiscount(null);
        Alert.error(result.error ?? paymentsDict.discount_invalid);
        return;
      }

      setAppliedDiscount({
        code: result.code ?? code,
        discount_amount: Number(result.discount_amount ?? 0),
      });
    } catch (err) {
      setAppliedDiscount(null);
      Alert.error(err instanceof Error ? err.message : paymentsDict.discount_error);
    } finally {
      setDiscountLoading(false);
    }
  };

  const createReservationOrder = async () => {
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
        is_reservation: true,
        customer_phone: user.phone || phone || undefined,
        order_source: checkoutSource,
        discount_code: appliedDiscount?.code ?? undefined,
      }),
    });

    const data = (await res.json()) as { id?: number; order_number?: string; error?: string };
    if (!res.ok || !data?.order_number)
      throw new Error(data?.error || paymentsDict.reservation.confirm_error);

    setSubmittedPaymentMethod(null);
    setOrderNumber(data.order_number);
  };

  const switchToReservation = async (targetOrderNumber: string) => {
    const res = await fetch("/api/shop/checkout/reserve/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber: targetOrderNumber }),
    });
    const data = (await res.json().catch(() => ({}))) as { orderNumber?: string; error?: string };
    if (!res.ok || !data.orderNumber)
      throw new Error(data.error || paymentsDict.reservation.switch_error);

    setSubmittedPaymentMethod(null);
    setOrderNumber(data.orderNumber);
  };

  const handleSubmit = async (selectedChoice: CheckoutChoice | null = payment) => {
    if (!campus) {
      Alert.error(dict.error_no_campus);
      return;
    }

    if (isMixedInvalid) {
      Alert.error(dict.error_mixed_invalid);
      return;
    }

    if (!selectedChoice) {
      Alert.error(dict.error_no_payment);
      return;
    }
    setLoading(true);
    try {
      if (selectedChoice === RESERVATION) {
        await createReservationOrder();
        return;
      }

      if (selectedChoice === "sumup" || selectedChoice === "mbway") {
        const effectivePhone = phone.trim() || user.phone || "";
        if (selectedChoice === "mbway" && !effectivePhone) {
          Alert.error(paymentsDict.phone_required);
          setLoading(false);
          return;
        }

        const reserveRes = await fetch("/api/shop/checkout/reserve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: apiItems,
            order_source: checkoutSource,
            payment_method: selectedChoice,
            customer_name: user.name,
            customer_email: user.email,
            customer_phone: effectivePhone || undefined,
            customer_nif: nif || undefined,
            campus,
            notes: notes || undefined,
            discount_code: appliedDiscount?.code ?? undefined,
          }),
        });

        const reserveData = (await reserveRes.json()) as { orderNumber?: string; error?: string };
        if (!reserveRes.ok || !reserveData?.orderNumber)
          throw new Error(reserveData?.error || dict.error_checkout_create);

        setSubmittedPaymentMethod(selectedChoice);
        setOrderNumber(reserveData.orderNumber);
        return;
      }
    } catch (err) {
      Alert.error(err instanceof Error ? err.message : dict.error_submit);
    } finally {
      setLoading(false);
    }
  };

  const handleApplePayDirect = () => {
    if (!campus) {
      Alert.error(dict.error_no_campus);
      return;
    }

    if (typeof window === "undefined" || !window.isSecureContext) {
      Alert.error(dict.error_apple_pay_context);
      return;
    }

    if (typeof window.ApplePaySession === "undefined") {
      Alert.error(dict.error_apple_pay_unavailable);
      return;
    }

    const ApplePaySession = window.ApplePaySession;
    if (!ApplePaySession.canMakePayments()) {
      Alert.error(dict.error_apple_pay_device);
      return;
    }

    let createdOrderNumber: string | null = null;
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

        // Reserve stock in Redis during Apple Pay checkout
        const reserveRes = await fetch("/api/shop/checkout/reserve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: apiItems,
            order_source: checkoutSource,
            payment_method: "apple-pay",
            customer_name: user.name,
            customer_email: user.email,
            customer_phone: user.phone || phone || undefined,
            customer_nif: nif || undefined,
            campus,
            notes: notes || undefined,
            discount_code: appliedDiscount?.code ?? undefined,
          }),
        });

        const reserveData = (await reserveRes.json()) as { orderNumber?: string; error?: string };
        if (!reserveRes.ok || !reserveData?.orderNumber)
          throw new Error(reserveData?.error || dict.error_checkout_create);

        createdOrderNumber = reserveData.orderNumber;

        const checkoutRes = await fetch("/api/shop/sumup/new", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderNumber: createdOrderNumber,
            currency: "EUR",
            checkout_reference: createdOrderNumber,
          }),
        });
        const checkoutData = (await checkoutRes.json()) as CreateCheckoutResponse;
        if (!checkoutRes.ok) throw new Error(checkoutData?.error || dict.error_checkout_create);

        checkoutId = checkoutData.checkoutId ?? null;
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
        if (createdOrderNumber) {
          try {
            await fetch("/api/shop/checkout/discard", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderNumber: createdOrderNumber }),
            });
          } catch {
            // ignore
          }
        }
        session.abort();
        Alert.error(error instanceof Error ? error.message : dict.error_apple_pay_failed);
        setLoading(false);
      }
    };

    session.onpaymentauthorized = async (event) => {
      try {
        if (!checkoutId || !createdOrderNumber) throw new Error(dict.error_payment_incomplete);

        const res = await fetch("/api/shop/sumup/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checkoutId,
            orderNumber: createdOrderNumber,
            applePayToken: event.payment.token as ApplePayPaymentToken,
          }),
        });
        const data = (await res.json()) as VerifyCheckoutResponse;

        if (res.ok && data?.ok) {
          session.completePayment(ApplePaySession.STATUS_SUCCESS);
          localStorage.setItem("cart", "[]");
          window.dispatchEvent(new Event("cartUpdated"));
          router.push(
            `${basePath || ""}/my-orders?orderId=${data.orderNumber || createdOrderNumber}`
          );
        } else {
          session.completePayment(ApplePaySession.STATUS_FAILURE);
          Alert.error(data?.error || dict.error_apple_pay_failure);
        }
      } catch (error) {
        session.completePayment(ApplePaySession.STATUS_FAILURE);
        Alert.error(error instanceof Error ? error.message : dict.error_apple_pay_processing);
      } finally {
        setLoading(false);
      }
    };

    session.oncancel = async () => {
      if (createdOrderNumber) {
        try {
          await fetch("/api/shop/checkout/discard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderNumber: createdOrderNumber }),
          });
        } catch {
          // ignore
        }
      }
      setLoading(false);
    };

    session.begin();
  };

  if (cart.length === 0 && !orderNumber) {
    return (
      <div className={styles.emptyCartContainer}>
        <p>{dict.empty_cart}</p>
      </div>
    );
  }

  const pickupOptions = [
    { id: Campus._Alameda, label: dict.campus_alameda },
    { id: Campus._Taguspark, label: dict.campus_taguspark },
  ] as const;

  const paymentOptions: { id: CheckoutChoice; label: string }[] = [
    ...getLocalizedPaymentMethods(["mbway", "sumup"], paymentsDict.methods),
    ...(!isSpecialOrderKind
      ? [
          {
            id: RESERVATION,
            label: paymentsDict.reservation.label,
          },
        ]
      : []),
  ];
  const isSelectedPaymentAllowed = payment !== null;
  const hasSelectedPayMethod = payment !== null && payment !== "apple-pay";
  const isApplePayAllowed = applePayAvailable && ONLINE_PAYMENT_METHODS.includes("apple-pay");
  const showApplePay = isApplePayAllowed && !hasSelectedPayMethod;

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
            {!isSpecialOrderKind && (
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
            )}
          </div>
        </section>

        <div className={styles.divider} />
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {isSpecialOrderKind ? dict.section_campus : dict.section_delivery}
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
          <h2 className={styles.sectionTitle}>{dict.section_payment}</h2>

          <div className={styles.radioGroup}>
            {paymentOptions.map((opt) => (
              <label key={opt.id} className={styles.radioOption}>
                <input
                  type="radio"
                  name="payment"
                  checked={payment === opt.id}
                  onChange={() => setPayment(opt.id)}
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

        <section className={styles.section}>
          <div className={styles.formGroup}>
            <label htmlFor="discount-code">{dict.discount_label}</label>
            <div className={styles.discountInputRow}>
              <input
                id="discount-code"
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                placeholder={dict.discount_placeholder}
                className={styles.input}
              />
              <button
                type="button"
                className={`${styles.checkoutButton} ${styles.discountApplyBtn}`}
                onClick={handleApplyDiscount}
                disabled={discountLoading || cart.length === 0}>
                {discountLoading ? dict.validating : dict.apply}
              </button>
            </div>
          </div>
        </section>

        {isSelectedPaymentAllowed && (
          <button
            className={styles.checkoutButton}
            onClick={() => handleSubmit()}
            disabled={loading}>
            {loading ? dict.processing : dict.submit}
          </button>
        )}

        {showApplePay && (
          <button
            className={styles.applePayStandaloneButton}
            onClick={handleApplePayDirect}
            disabled={loading}
            aria-label={dict.apple_pay_label}></button>
        )}
      </div>

      <div className={styles.rightColumn}>
        <div className={styles.summarySticky}>
          <h2 className={styles.summaryTitle}>{dict.summary_title}</h2>
          <div className={styles.cartItems}>
            {cart.map((item) => {
              const variantObj =
                item.variantId != null
                  ? findItemVariant(item.product, { variant_id: item.variantId })
                  : null;

              const imageSrc = getItemImage(item.product, variantObj);
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
                        {formatMoney(unitPrice(item))} x {item.quantity}
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
                  <span>{dict.subtotal}</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                <div className={styles.priceLine}>
                  <span>{dict.iva}</span>
                  <span>{formatMoney(taxes)}</span>
                </div>
              </>
            )}
            {appliedDiscount && discountAmount > 0 && (
              <div className={styles.priceLine}>
                <span>
                  {dict.discount_applied} ({appliedDiscount.code})
                </span>
                <span>-{formatMoney(discountAmount)}</span>
              </div>
            )}
            {(!isSpecialOrderKind || (appliedDiscount && discountAmount > 0)) && (
              <div className={styles.priceDivider} />
            )}
            <div className={styles.totalLine}>
              <span>{dict.total}</span>
              <span>{formatMoney(total)}</span>
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
                    <span className={styles.expandText}>{dict.tax_info}</span>
                    <FaChevronDown
                      className={`${styles.expandIcon} ${showTaxInfo ? styles.expanded : ""}`}
                    />
                  </button>
                  {showTaxInfo && (
                    <div className={styles.expandContent}>{dict.tax_info_detail}</div>
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
                    <span className={styles.expandText}>{dict.delivery_estimate}</span>
                    <FaChevronDown
                      className={`${styles.expandIcon} ${showDeliveryInfo ? styles.expanded : ""}`}
                    />
                  </button>
                  {showDeliveryInfo && (
                    <div className={styles.expandContent}>{dict.delivery_detail}</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {orderNumber !== null && (
        <ShopCheckoutOverlay
          orderNumber={orderNumber}
          paymentMethod={submittedPaymentMethod}
          customerPhone={phone.trim() || user.phone || undefined}
          dict={checkoutOverlayDict}
          pendingPaymentDict={pendingPaymentDict}
          paymentsDict={paymentsDict}
          onSwitchToReservation={switchToReservation}
          basePath={basePath}
        />
      )}
    </div>
  );
}
