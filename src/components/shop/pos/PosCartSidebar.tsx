"use client";

import React from "react";
import Image from "next/image";
import { Badge, Button, Input, Card, Stack, EmptyState, Text, Tooltip } from "@neiist/ui";
import { FiTrash2, FiMinus, FiPlus } from "react-icons/fi";
import { CartItem } from "@/types/shop/product";
import VariantTags from "@/components/shop/VariantTags";
import { getCartItemVariant, getItemImage } from "@/utils/shop/shopUtils";
import { formatMoney, lineTotalMoney } from "@/utils/shop/moneyUtils";
import styles from "@/styles/components/shop/pos/PosCartSidebar.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface PosCartSidebarProps {
  cart: CartItem[];
  pendingOrderNumber?: string | null;
  totalAmount: number;
  subtotalAmount?: number;
  appliedDiscount?: {
    code: string;
    discount_amount: number;
    discount_type?: "percentage" | "fixed";
    discount_value?: number;
  } | null;
  discountCodeInput?: string;
  onDiscountCodeInputChange?: (_val: string) => void;
  onApplyDiscount?: () => void;
  onRemoveDiscount?: () => void;
  isApplyingDiscount?: boolean;
  onUpdateQuantity: (_index: number, _delta: number) => void;
  onRemoveFromCart: (_index: number) => void;
  onClearCart: () => void;
  onClearPendingOrder?: () => void;
  onOpenPaymentModal: () => void;
  footerSlot?: React.ReactNode;
  dict: Dictionary["pos"]["cart"];
  isChargeDisabled?: boolean;
  chargeDisabledReason?: string;
}

export default function PosCartSidebar({
  cart,
  pendingOrderNumber = null,
  totalAmount,
  subtotalAmount,
  appliedDiscount,
  discountCodeInput,
  onDiscountCodeInputChange,
  onApplyDiscount,
  onRemoveDiscount,
  isApplyingDiscount,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  onClearPendingOrder,
  onOpenPaymentModal,
  footerSlot,
  dict,
  isChargeDisabled = false,
  chargeDisabledReason,
}: PosCartSidebarProps) {
  return (
    <Card variant="flat" className={styles.cartCard}>
      <Card.Header
        title={dict.title}
        action={
          cart.length > 0 ? (
            <Button
              size="sm"
              variant="ghost"
              color="neutral"
              onClick={
                pendingOrderNumber && onClearPendingOrder ? onClearPendingOrder : onClearCart
              }>
              {dict.clear}
            </Button>
          ) : undefined
        }
      />

      <Card.Body>
        <Stack direction="column" gap="md">
          {pendingOrderNumber && (
            <Card variant="flat">
              <Card.Body>
                <Stack direction="row" justify="between" align="center" gap="sm">
                  <Stack direction="column" gap="sm">
                    <strong>
                      {dict.reservation_label.replace("{number}", pendingOrderNumber)}
                    </strong>
                    <Text size="sm" variant="muted">
                      {dict.reservation_loading}
                    </Text>
                  </Stack>
                  <Button size="sm" variant="outline" color="danger" onClick={onClearPendingOrder}>
                    {dict.discard}
                  </Button>
                </Stack>
              </Card.Body>
            </Card>
          )}

          {cart.length === 0 ? (
            <EmptyState title={dict.empty} description={dict.empty_hint} />
          ) : (
            <div className={styles.cartContent}>
              {cart.map((item, idx) => {
                const variant = getCartItemVariant(item);
                const itemTotal = lineTotalMoney(
                  item.product.price,
                  variant?.price_modifier,
                  item.quantity
                );
                const imageSrc = getItemImage(item.product, variant);

                return (
                  <div
                    key={`cart-${item.product.id}-${item.variantId ?? "default"}`}
                    className={styles.cartItem}>
                    {imageSrc && (
                      <div className={styles.cartImageWrapper}>
                        <Image
                          src={imageSrc}
                          alt={item.product.name}
                          fill
                          className={styles.cartProductImage}
                        />
                      </div>
                    )}

                    <Stack direction="column" gap="none" className={styles.cartItemBody}>
                      <h4 className={styles.cartItemTitle}>{item.product.name}</h4>
                      <VariantTags
                        options={variant?.options}
                        label={variant?.label}
                        showColorSwatch
                      />
                    </Stack>

                    <Stack
                      direction="row"
                      gap="sm"
                      align="center"
                      className={styles.cartItemActions}>
                      <Stack direction="row" gap="none" align="center">
                        <Button
                          type="button"
                          variant="ghost"
                          color="neutral"
                          size="sm"
                          className={styles.qtyBtn}
                          onClick={() => onUpdateQuantity(idx, -1)}>
                          <FiMinus size={13} />
                        </Button>
                        <strong className={styles.quantityCount}>{item.quantity}</strong>
                        <Button
                          type="button"
                          variant="ghost"
                          color="neutral"
                          size="sm"
                          className={styles.qtyBtn}
                          onClick={() => onUpdateQuantity(idx, 1)}>
                          <FiPlus size={13} />
                        </Button>
                      </Stack>

                      <span className={styles.priceTag}>{formatMoney(itemTotal)}</span>

                      <Button
                        type="button"
                        variant="ghost"
                        color="danger"
                        size="sm"
                        className={styles.qtyBtn}
                        onClick={() => onRemoveFromCart(idx)}
                        title={dict.remove}>
                        <FiTrash2 size={14} />
                      </Button>
                    </Stack>
                  </div>
                );
              })}
            </div>
          )}
        </Stack>
      </Card.Body>

      <Card.Footer>
        <Stack direction="column" gap="md" style={{ width: "100%" }}>
          {footerSlot}

          {!appliedDiscount && onApplyDiscount && (
            <Stack direction="row" gap="sm" align="center">
              <div className={styles.discountInputWrapper}>
                <Input
                  placeholder={dict.discount_placeholder}
                  value={discountCodeInput || ""}
                  onChange={(e) => onDiscountCodeInputChange?.(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onApplyDiscount?.();
                    }
                  }}
                  disabled={cart.length === 0 || Boolean(pendingOrderNumber) || isApplyingDiscount}
                />
              </div>
              <Button
                variant="outline"
                onClick={onApplyDiscount}
                loading={isApplyingDiscount}
                disabled={
                  !discountCodeInput?.trim() ||
                  cart.length === 0 ||
                  Boolean(pendingOrderNumber) ||
                  isApplyingDiscount
                }>
                {dict.apply}
              </Button>
            </Stack>
          )}

          <Stack direction="column" gap="sm">
            {appliedDiscount && subtotalAmount !== undefined && (
              <Stack direction="row" justify="between" align="center">
                <Text size="sm" variant="muted">
                  {dict.subtotal}
                </Text>
                <Text size="sm" variant="muted">
                  {formatMoney(subtotalAmount)}
                </Text>
              </Stack>
            )}

            {appliedDiscount && (
              <Stack direction="row" justify="between" align="center">
                <Badge
                  variant="primary"
                  size="sm"
                  removable={Boolean(onRemoveDiscount)}
                  onRemove={onRemoveDiscount}
                  removeAriaLabel={dict.remove_discount}>
                  {dict.discount.replace("{code}", appliedDiscount.code)}
                </Badge>
                <Text size="sm" className={styles.discountAmount}>
                  -{formatMoney(appliedDiscount.discount_amount || 0)}
                </Text>
              </Stack>
            )}

            <Stack direction="row" justify="between" align="center" className={styles.totalRow}>
              <span>{dict.total}</span>
              <strong>{formatMoney(totalAmount)}</strong>
            </Stack>
          </Stack>

          {cart.length > 0 && isChargeDisabled && chargeDisabledReason ? (
            <Tooltip content={chargeDisabledReason} position="top">
              <div style={{ width: "100%" }}>
                <Button variant="primary" size="lg" fullWidth disabled>
                  {dict.charge.replace("{amount}", formatMoney(totalAmount))}
                </Button>
              </div>
            </Tooltip>
          ) : (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={cart.length === 0}
              onClick={onOpenPaymentModal}>
              {dict.charge.replace("{amount}", formatMoney(totalAmount))}
            </Button>
          )}
        </Stack>
      </Card.Footer>
    </Card>
  );
}
