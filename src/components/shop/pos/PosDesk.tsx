"use client";

import React, { useState, useCallback } from "react";
import { Alert } from "@neiist/ui";
import { Product, ProductVariant } from "@/types/shop/product";
import { Category } from "@/types/shop/category";
import { PosStation } from "@/types/shop/pos";
import { Order } from "@/types/shop/order";
import { User } from "@/types/user";
import { useUser } from "@/context/UserContext";
import { hasPermission } from "@/lib/security/permissions";
import PosPaymentModal from "./modals/PosPaymentModal";
import PosGuestCustomerModal from "./modals/PosGuestCustomerModal";
import PosPendingOrdersModal from "./modals/PosPendingOrdersModal";
import PosShiftCloseModal from "./modals/PosShiftCloseModal";
import PosDeskGuard from "./PosDeskGuard";
import PosDeskHeader from "./PosDeskHeader";
import PosCustomerSection from "./PosCustomerSection";
import PosCatalogGrid from "./PosCatalogGrid";
import PosCartSidebar from "./PosCartSidebar";
import { usePosSession } from "@/hooks/shop/pos/usePosSession";
import { usePosVariantSelector } from "@/hooks/shop/pos/usePosVariantSelector";
import { usePosCheckout } from "@/hooks/shop/pos/usePosCheckout";
import styles from "@/styles/components/shop/pos/PosDesk.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface PosDeskProps {
  products: Product[];
  stations: PosStation[];
  categories?: Category[];
  basePath: string;
  initialPendingOrder?: Order | null;
  currentUser?: User | null;
  dict: Dictionary["pos"];
  paymentsDict: Dictionary["payments"];
}

export default function PosDesk({
  products,
  stations,
  categories = [],
  basePath,
  initialPendingOrder,
  currentUser,
  dict,
  paymentsDict,
}: PosDeskProps) {
  const { user } = useUser();
  const effectiveUser = currentUser ?? user;
  const canAccessPos = effectiveUser ? hasPermission(effectiveUser, "pos:access") : false;
  const canOverride = effectiveUser ? hasPermission(effectiveUser, "orders:override") : false;

  const session = usePosSession({
    stations,
    storageKeys: ["neiist_pos_station"],
    dict: dict.shift,
  });

  const {
    customer,
    setCustomer,
    isGuestModalOpen,
    setIsGuestModalOpen,
    customerNif,
    setCustomerNif,
    customerPhone,
    setCustomerPhone,
    selectedCampus,
    setSelectedCampus,
    orderNotes,
    setOrderNotes,
    cart,
    setCart,
    pendingOrderNumber,
    pendingOrderNumbers,
    pendingOrdersPrompt,
    setPendingOrdersPrompt,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    addToCart,
    updateQuantity,
    removeFromCart,
    subtotalAmount,
    totalAmount,
    appliedDiscount,
    discountCodeInput,
    setDiscountCodeInput,
    isApplyingDiscount,
    handleApplyDiscount,
    handleRemoveDiscount,
    handleClearPendingOrder,
    loadPendingOrdersToCart,
    handleConfirmGuest,
    handleConfirmOrderPayment,
    handleFinishSale,
    handleSelectUser,
  } = usePosCheckout({
    products,
    initialPendingOrder,
    selectedStationId: session.selectedStationId,
    activeShift: session.activeShift,
    canOverride,
    dict,
  });

  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const {
    activeVariantProduct,
    selectedVariantOptions,
    availableValuesForCurrentKey,
    currentOptionKey,
    handleProductCardClick: baseProductCardClick,
    handleSelectVariantOptionValue,
    handleVariantBack,
  } = usePosVariantSelector(
    useCallback(
      (product: Product, variant: ProductVariant | null) => addToCart(product, variant),
      [addToCart]
    )
  );

  const handleProductCardClick = useCallback(
    (product: Product) => {
      if (pendingOrderNumber) {
        Alert.error(dict.alerts.reservation_locked_cart);
        return;
      }
      baseProductCardClick(product);
    },
    [baseProductCardClick, pendingOrderNumber, dict.alerts.reservation_locked_cart]
  );

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
        title={dict.desk.identified_title}
        subtitle={dict.desk.identified_subtitle}
        dict={dict}
      />
    );
  }

  return (
    <div className={styles.root}>
      <PosDeskHeader
        title={dict.desk.identified_title}
        subtitle={dict.desk.identified_subtitle}
        session={session}
        dict={dict}
      />

      <div className={styles.mainLayout}>
        <div className={styles.leftColumn}>
          <PosCustomerSection
            customer={customer}
            onSelectUser={handleSelectUser}
            onOpenGuestModal={() => setIsGuestModalOpen(true)}
            onClearCustomer={() => setCustomer(null)}
            customerNif={customerNif}
            onCustomerNifChange={setCustomerNif}
            selectedCampus={selectedCampus}
            onCampusChange={setSelectedCampus}
            customerPhone={customerPhone}
            onCustomerPhoneChange={setCustomerPhone}
            orderNotes={orderNotes}
            onOrderNotesChange={setOrderNotes}
            dict={dict.customer}
          />

          <PosCatalogGrid
            products={products}
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
            dict={dict.catalog}
          />
        </div>

        <PosCartSidebar
          cart={cart}
          pendingOrderNumber={pendingOrderNumber}
          totalAmount={totalAmount}
          subtotalAmount={subtotalAmount}
          appliedDiscount={appliedDiscount}
          discountCodeInput={discountCodeInput}
          onDiscountCodeInputChange={setDiscountCodeInput}
          onApplyDiscount={handleApplyDiscount}
          onRemoveDiscount={handleRemoveDiscount}
          isApplyingDiscount={isApplyingDiscount}
          onUpdateQuantity={updateQuantity}
          onRemoveFromCart={removeFromCart}
          onClearCart={() => setCart([])}
          onClearPendingOrder={handleClearPendingOrder}
          onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
          dict={dict.cart}
        />
      </div>

      {isGuestModalOpen && (
        <PosGuestCustomerModal
          open={isGuestModalOpen}
          onClose={() => setIsGuestModalOpen(false)}
          onConfirm={handleConfirmGuest}
          dict={dict.guest}
        />
      )}

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

      <PosPendingOrdersModal
        orders={pendingOrdersPrompt}
        onClose={() => setPendingOrdersPrompt([])}
        onLoadOrders={(ords) => loadPendingOrdersToCart(ords)}
        dict={dict.pending}
      />

      {isPaymentModalOpen && (
        <PosPaymentModal
          open={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          mode="identified"
          totalAmount={totalAmount}
          orderNumber={pendingOrderNumber || undefined}
          orderNumbers={pendingOrderNumbers.length > 0 ? pendingOrderNumbers : undefined}
          discountCode={appliedDiscount?.code}
          userIstid={!customer?.isGuest ? customer?.istid || undefined : undefined}
          stationName={session.selectedStation?.name}
          cartItems={cart}
          customerPhone={customerPhone || customer?.phone || undefined}
          ordersBasePath={basePath}
          canOverride={canOverride}
          onConfirm={handleConfirmOrderPayment}
          onFinish={handleFinishSale}
          dict={dict.payment}
          paymentsDict={paymentsDict}
        />
      )}
    </div>
  );
}
