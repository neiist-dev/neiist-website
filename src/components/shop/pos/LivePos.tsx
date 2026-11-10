"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Alert, Field, Input } from "@neiist/ui";
import { CartItem, Product, ProductVariant } from "@/types/shop/product";
import { PosStation } from "@/types/shop/pos";
import { User } from "@/types/user";
import { useUser } from "@/context/UserContext";
import { hasPermission } from "@/lib/security/permissions";
import PosDeskGuard from "@/components/shop/pos/PosDeskGuard";
import PosDeskHeader from "@/components/shop/pos/PosDeskHeader";
import PosCatalogGrid from "@/components/shop/pos/PosCatalogGrid";
import PosCartSidebar from "@/components/shop/pos/PosCartSidebar";
import PosPaymentModal, {
  type PosPaymentConfirmData,
} from "@/components/shop/pos/modals/PosPaymentModal";
import PosShiftCloseModal from "@/components/shop/pos/modals/PosShiftCloseModal";
import { usePosSession } from "@/hooks/shop/pos/usePosSession";
import { usePosVariantSelector } from "@/hooks/shop/pos/usePosVariantSelector";
import { upsertPosCartItem, updatePosCartItemQuantity } from "@/utils/shop/posUtils";
import { calculateCartSubtotal } from "@/utils/shop/shopUtils";
import styles from "@/styles/components/shop/pos/PosDesk.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface LivePosProps {
  products: Product[];
  stations: PosStation[];
  currentUser?: User | null;
  dict: Dictionary["pos"];
  paymentsDict: Dictionary["payments"];
}

export default function LivePos({
  products,
  stations,
  currentUser,
  dict,
  paymentsDict,
}: LivePosProps) {
  const { user } = useUser();
  const effectiveUser = currentUser ?? user;
  const canAccessPos = effectiveUser ? hasPermission(effectiveUser, "pos:access") : false;
  const canOverride = effectiveUser ? hasPermission(effectiveUser, "orders:override") : false;

  const session = usePosSession({
    stations,
    storageKeys: ["neiist_pos_station", "neiist_fast_pos_station"],
    dict: dict.shift,
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string>(() => crypto.randomUUID());
  const [customerNif, setCustomerNif] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const fastProducts = useMemo(() => {
    return products.filter(
      (p) =>
        (p.channels?.includes("fast-pos") || p.product_type === "food_drink") &&
        p.stock_type === "untracked"
    );
  }, [products]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    fastProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [fastProducts]);

  const addToCart = useCallback((product: Product, variant: ProductVariant | null) => {
    setCart((prev) => upsertPosCartItem(prev, product, variant));
  }, []);

  const {
    activeVariantProduct,
    selectedVariantOptions,
    availableValuesForCurrentKey,
    currentOptionKey,
    handleProductCardClick,
    handleSelectVariantOptionValue,
    handleVariantBack,
  } = usePosVariantSelector(addToCart);

  const updateQuantity = (idx: number, delta: number) => {
    setCart((prev) => updatePosCartItemQuantity(prev, idx, delta));
  };

  const removeFromCart = (idx: number) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearCart = () => {
    setCart([]);
    setCartId(crypto.randomUUID());
    setCustomerNif("");
  };

  const getSelectedCount = useCallback(
    (product: Product) =>
      cart
        .filter((item) => item.product.id === product.id)
        .reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const totalAmount = useMemo(() => calculateCartSubtotal(cart), [cart]);

  const handleConfirmPayment = async (data: PosPaymentConfirmData) => {
    if (!session.activeShift) {
      Alert.error(dict.payment.shift_required);
      return;
    }

    const payload = {
      order_source: "fast-pos",
      order_number: data.orderNumber || undefined,
      cart_id: cartId,
      shift_id: session.activeShift.id,
      station_id: session.selectedStationId,
      payment_method: data.method,
      stock_override: canOverride,
      payment: {
        method: data.method,
        status: data.paymentStatus,
        reference: data.reference || undefined,
        shift_id: session.activeShift.id,
      },
      customer_nif: customerNif.trim() || undefined,
      items: cart.map((item) => ({
        product_id: item.product.id,
        variant_id: item.variantId ?? undefined,
        quantity: item.quantity,
        deliver_now: true,
      })),
    };

    const res = await fetch("/api/shop/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || dict.payment.sale_error);
    }

    const result = await res.json();
    Alert.success(
      dict.alerts.fast_sale_success.replace(
        "{number}",
        String(result.order_number || result.orderNumber || "")
      )
    );

    clearCart();
    setIsPaymentModalOpen(false);
  };

  const isBlocked =
    !canAccessPos ||
    !session.hasCheckedAllStations ||
    !session.stationSelectionConfirmed ||
    (!session.activeShift && !session.shiftLoading);

  if (isBlocked) {
    return (
      <PosDeskGuard
        canAccessPos={canAccessPos}
        session={session}
        stations={stations}
        title={dict.desk.fast_title}
        subtitle={dict.desk.fast_subtitle}
        dict={dict}
      />
    );
  }

  return (
    <div className={styles.root}>
      <PosDeskHeader
        title={dict.desk.fast_title}
        subtitle={dict.desk.fast_subtitle}
        session={session}
        dict={dict}
      />

      <div className={styles.mainLayout}>
        <div className={styles.leftColumn}>
          <PosCatalogGrid
            products={fastProducts}
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onProductCardClick={handleProductCardClick}
            activeVariantProduct={activeVariantProduct}
            selectedVariantOptions={selectedVariantOptions}
            availableValuesForCurrentKey={availableValuesForCurrentKey}
            currentOptionKey={currentOptionKey}
            onSelectVariantOptionValue={handleSelectVariantOptionValue}
            onVariantBack={handleVariantBack}
            canOverride={canOverride}
            filterAvailable={false}
            getSelectedCount={getSelectedCount}
            dict={dict.catalog}
          />
        </div>

        <PosCartSidebar
          cart={cart}
          totalAmount={totalAmount}
          onUpdateQuantity={updateQuantity}
          onRemoveFromCart={removeFromCart}
          onClearCart={clearCart}
          onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
          footerSlot={
            <Field label={dict.customer.nif_label}>
              <Input
                placeholder={dict.customer.nif_placeholder}
                value={customerNif}
                onChange={(e) => setCustomerNif(e.target.value)}
              />
            </Field>
          }
          dict={dict.cart}
        />
      </div>

      <PosPaymentModal
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        mode="fast"
        totalAmount={totalAmount}
        stationName={session.selectedStation?.name}
        cartItems={cart}
        onConfirm={handleConfirmPayment}
        dict={dict.payment}
        paymentsDict={paymentsDict}
      />

      <PosShiftCloseModal
        open={session.isCloseModalOpen}
        activeShift={session.activeShift}
        selectedStationName={session.selectedStation?.name}
        countedCashInput={session.countedCashInput}
        onCountedChange={session.setCountedCashInput}
        closing={session.closingShift}
        onClose={() => session.setIsCloseModalOpen(false)}
        onConfirm={session.handleCloseShift}
        dict={dict.shift}
      />
    </div>
  );
}
