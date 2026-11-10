"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FiClock } from "react-icons/fi";
import ShopCheckoutOverlay from "@/components/shop/checkout/ShopCheckoutOverlay";
import {
  Accordion,
  Alert,
  Button,
  Divider,
  EmptyState,
  Field,
  Heading,
  Input,
  Radio,
  RadioGroup,
  Spinner,
  Stack,
  Text,
  Textarea,
} from "@neiist/ui";
import { useCheckoutHold } from "@/hooks/shop/checkout/useCheckoutHold";
import {
  getCartItemVariant,
  getCartItemUnitPrice,
  calculateCartSubtotal,
  clearClientCart,
  getItemImage,
  getLocalizedPaymentMethods,
  formatTimer,
} from "@/utils/shop/shopUtils";
import styles from "@/styles/components/shop/checkout/CheckoutForm.module.css";
import overlayStyles from "@/styles/components/shop/checkout/ShopCheckoutOverlay.module.css";

import { Campus } from "@/types/shop/order";
import {
  CheckoutChoice,
  PaymentMethod,
  RESERVATION,
  ONLINE_PAYMENT_METHODS,
} from "@/types/shop/payment";
import { CartItem } from "@/types/shop/product";
import Image from "next/image";
import { User } from "@/types/user";
import type {
  ApplePayPaymentRequest,
  ApplePayPaymentToken,
  CreateCheckoutResponse,
  VerifyCheckoutResponse,
} from "@/types/shop/sumup";
import VariantTags from "@/components/shop/VariantTags";
import { validateDiscount } from "@/utils/shop/discountUtils";
import { subtractMoney, toCents, fromCents, formatMoney } from "@/utils/shop/moneyUtils";
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
  const [cartLoaded, setCartLoaded] = useState(false);
  const [campus, setCampus] = useState<Campus>(Campus._Alameda);
  const [payment, setPayment] = useState<CheckoutChoice | null>(null);
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [submittedPaymentMethod, setSubmittedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isCheckoutCompleted, setIsCheckoutCompleted] = useState(false);
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
      } finally {
        setCartLoaded(true);
      }
    };
    load();
    window.addEventListener("cartUpdated", load);
    return () => window.removeEventListener("cartUpdated", load);
  }, []);

  const { hold, apiItems, remainingSeconds, isAcquiring, syncSession, clearHold } = useCheckoutHold(
    {
      cart,
      cartLoaded,
      isCompleted: isCheckoutCompleted,
      expiredMessage: dict.hold_expired,
      reserveErrorMessage: dict.error_checkout_create,
      basePath,
    }
  );

  const handleHoldEnded = useCallback(() => {
    setIsCheckoutCompleted(true);
    clearHold();
  }, [clearHold]);

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

  const cartTotal = calculateCartSubtotal(cart);
  const discountAmount = appliedDiscount?.discount_amount ?? 0;
  const total = Math.max(subtractMoney(cartTotal, discountAmount), 0);
  const subtotal = fromCents(Math.round(toCents(cartTotal) / 1.23)); // Price without IVA
  const taxes = subtractMoney(cartTotal, subtotal); // IVA amount (23% of subtotal)
  const hasTickets = cart.some((item) => item.product.product_type === "event_ticket");
  const hasMerchandise = cart.some((item) => item.product.product_type !== "event_ticket");
  const isMixedInvalid = hasTickets && hasMerchandise;
  const isSpecialOrderKind = hasTickets;

  const buildReserveFields = (paymentMethod?: PaymentMethod) => ({
    payment_method: paymentMethod,
    customer_name: user.name,
    customer_email: user.email,
    customer_phone: phone.trim() || user.phone || undefined,
    customer_nif: nif || undefined,
    campus,
    notes: notes || undefined,
    discount_code: appliedDiscount?.code ?? undefined,
  });

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

  const switchToReservation = async (targetOrderNumber: string) => {
    const res = await fetch("/api/shop/checkout/reserve/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber: targetOrderNumber }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      orderNumber?: string;
      error?: string;
    };
    if (!res.ok || !data.orderNumber)
      throw new Error(data.error || paymentsDict.reservation.switch_error);

    setIsCheckoutCompleted(true);
    clearHold();
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
      const effectivePhone = phone.trim() || user.phone || "";
      if (selectedChoice === "mbway" && !effectivePhone) {
        Alert.error(paymentsDict.phone_required);
        setLoading(false);
        return;
      }

      const synced = await syncSession(
        buildReserveFields(selectedChoice === RESERVATION ? undefined : selectedChoice)
      );
      if (selectedChoice === RESERVATION) {
        await switchToReservation(synced.orderNumber);
      } else {
        setSubmittedPaymentMethod(selectedChoice);
        setOrderNumber(synced.orderNumber);
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

        const synced = await syncSession(buildReserveFields("apple-pay"));

        createdOrderNumber = synced.orderNumber;

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
          body: JSON.stringify({
            checkoutId,
            validationUrl: event.validationURL,
          }),
        });
        if (!merchantRes.ok) throw new Error(dict.error_applepay_validation);

        const merchantSession = (await merchantRes.json()) as unknown;
        session.completeMerchantValidation(merchantSession);
      } catch (error) {
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
          setIsCheckoutCompleted(true);
          clearHold();
          clearClientCart();
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

    session.oncancel = () => {
      setLoading(false);
    };

    session.begin();
  };

  if (cart.length === 0 && !orderNumber) {
    return (
      <div className={styles.emptyCartContainer}>
        <EmptyState title={dict.empty_cart} />
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
      <Stack direction="column" gap="lg" className={styles.leftColumn}>
        <Stack direction="column" gap="md">
          <Heading level={5}>{dict.section_personal}</Heading>
          <div className={styles.formGrid}>
            <Input
              type="tel"
              label={dict.phone_label}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={dict.phone_placeholder}
            />
            {!isSpecialOrderKind && (
              <Input
                type="text"
                label={dict.nif_label}
                value={nif}
                onChange={(e) => setNif(e.target.value)}
                placeholder={dict.nif_placeholder}
              />
            )}
          </div>
        </Stack>

        <Divider />

        <Stack direction="column" gap="md">
          <Heading level={5}>
            {isSpecialOrderKind ? dict.section_campus : dict.section_delivery}
          </Heading>
          <RadioGroup
            name="campus"
            direction="row"
            value={campus}
            onChange={(val) => setCampus(val as Campus)}>
            {pickupOptions.map((opt) => (
              <Radio key={opt.id} value={opt.id} label={opt.label} />
            ))}
          </RadioGroup>
        </Stack>

        <Divider />

        <Stack direction="column" gap="md">
          <Heading level={5}>{dict.section_payment}</Heading>
          <RadioGroup
            name="payment"
            direction="row"
            value={payment ?? ""}
            onChange={(val) => setPayment(val as CheckoutChoice)}>
            {paymentOptions.map((opt) => (
              <Radio
                key={opt.id}
                value={opt.id}
                label={opt.label}
                onClick={() => {
                  if (payment === opt.id) setPayment(null);
                }}
              />
            ))}
          </RadioGroup>
        </Stack>

        <Divider />

        <Stack direction="column" gap="md">
          <Heading level={5}>{dict.section_notes}</Heading>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={dict.notes_placeholder}
            rows={4}
          />
        </Stack>

        <Field label={dict.discount_label} htmlFor="discount-code">
          <Stack direction="row" gap="sm" align="center">
            <Input
              id="discount-code"
              type="text"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              placeholder={dict.discount_placeholder}
            />
            <Button
              type="button"
              variant="primary"
              loading={discountLoading}
              onClick={handleApplyDiscount}
              disabled={cart.length === 0}>
              {discountLoading ? dict.validating : dict.apply}
            </Button>
          </Stack>
        </Field>

        {isSelectedPaymentAllowed && (
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onClick={() => handleSubmit()}
            disabled={isAcquiring}>
            {loading ? dict.processing : dict.submit}
          </Button>
        )}

        {showApplePay && (
          <button
            className={styles.applePayStandaloneButton}
            onClick={handleApplePayDirect}
            disabled={loading || isAcquiring}
            aria-label={dict.apple_pay_label}
          />
        )}
      </Stack>

      <div className={styles.rightColumn}>
        <Stack direction="column" gap="lg">
          <Stack
            direction="row"
            align="center"
            justify="between"
            gap="sm"
            className={styles.summaryHeader}>
            <Heading level={3} className={styles.summaryTitle}>
              {dict.summary_title}
            </Heading>
            {hold && !isCheckoutCompleted && (
              <span
                className={`${styles.holdTimer} ${remainingSeconds <= 60 ? styles.holdTimerDanger : ""}`}
                role="status"
                aria-live="off">
                <FiClock aria-hidden="true" />
                {formatTimer(remainingSeconds)}
              </span>
            )}
          </Stack>

          <Stack direction="column" gap="md">
            {cart.map((item) => {
              const variantObj = getCartItemVariant(item);
              const imageSrc = getItemImage(item.product, variantObj);
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
                  <Stack direction="column" gap="sm" className={styles.productDetails}>
                    <Stack direction="row" align="center" justify="between" gap="sm">
                      <Heading level={6} className={styles.summaryTitle}>
                        {item.product.name}
                      </Heading>
                      <span className={styles.productPrice}>
                        {formatMoney(getCartItemUnitPrice(item))} x {item.quantity}
                      </span>
                    </Stack>
                    <VariantTags
                      options={variantObj?.options}
                      label={variantObj?.label}
                      showColorSwatch
                    />
                  </Stack>
                </div>
              );
            })}
          </Stack>

          <Stack direction="column" gap="sm">
            {!isSpecialOrderKind && (
              <>
                <Stack direction="row" justify="between">
                  <Text size="sm" variant="muted">
                    {dict.subtotal}
                  </Text>
                  <Text size="sm" variant="muted">
                    {formatMoney(subtotal)}
                  </Text>
                </Stack>
                <Stack direction="row" justify="between">
                  <Text size="sm" variant="muted">
                    {dict.iva}
                  </Text>
                  <Text size="sm" variant="muted">
                    {formatMoney(taxes)}
                  </Text>
                </Stack>
              </>
            )}
            {appliedDiscount && discountAmount > 0 && (
              <Stack direction="row" justify="between">
                <Text size="sm" variant="muted">
                  {dict.discount_applied} ({appliedDiscount.code})
                </Text>
                <Text size="sm" variant="muted">
                  -{formatMoney(discountAmount)}
                </Text>
              </Stack>
            )}
            {(!isSpecialOrderKind || (appliedDiscount && discountAmount > 0)) && <Divider />}
            <Stack direction="row" align="center" justify="between" className={styles.totalLine}>
              <span>{dict.total}</span>
              <strong>{formatMoney(total)}</strong>
            </Stack>
          </Stack>

          {!isSpecialOrderKind && (
            <Accordion type="multiple" variant="flush">
              <Accordion.Item value="tax">
                <Accordion.Trigger className={styles.accordionTrigger}>
                  {dict.tax_info}
                </Accordion.Trigger>
                <Accordion.Content>
                  <Text size="sm" variant="muted" className={styles.accordionDetail}>
                    {dict.tax_info_detail}
                  </Text>
                </Accordion.Content>
              </Accordion.Item>
              <Accordion.Item value="delivery">
                <Accordion.Trigger className={styles.accordionTrigger}>
                  {dict.delivery_estimate}
                </Accordion.Trigger>
                <Accordion.Content>
                  <Text size="sm" variant="muted" className={styles.accordionDetail}>
                    {dict.delivery_detail}
                  </Text>
                </Accordion.Content>
              </Accordion.Item>
            </Accordion>
          )}
        </Stack>
      </div>
      {loading && orderNumber === null && (
        <div className={overlayStyles.overlay}>
          <Spinner
            state="loading"
            title={dict.processing}
            subtitle={checkoutOverlayDict.wait_moment}
            size={48}
          />
        </div>
      )}
      {orderNumber !== null && (
        <ShopCheckoutOverlay
          orderNumber={orderNumber}
          paymentMethod={submittedPaymentMethod}
          customerPhone={phone.trim() || user.phone || undefined}
          dict={checkoutOverlayDict}
          pendingPaymentDict={pendingPaymentDict}
          paymentsDict={paymentsDict}
          onSwitchToReservation={switchToReservation}
          onHoldEnded={handleHoldEnded}
          basePath={basePath}
        />
      )}
    </div>
  );
}
