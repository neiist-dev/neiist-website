"use client";

import React, { useState } from "react";
import { Badge, type BadgeProps, Text } from "@neiist/ui";
import { Product } from "@/types/shop/product";
import ProductImage from "@/components/shop/catalog/ProductImage";
import { formatMoney } from "@/utils/shop/moneyUtils";
import { getProductPosAvailability } from "@/utils/shop/posUtils";
import { getProductStock } from "@/utils/shop/shopUtils";
import styles from "@/styles/components/shop/pos/PosProductCard.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

type PosProductCardI18nProps =
  | {
      badge: { label: React.ReactNode; variant?: BadgeProps["variant"] } | null;
      noImageLabel: string;
      dict?: never;
    }
  | {
      badge?: never;
      noImageLabel?: never;
      dict: Dictionary["pos"]["catalog"];
    };

type PosProductCardProps = PosProductCardI18nProps & {
  product: Product;
  onClick: () => void;
  canOverride?: boolean;
  selectedCount?: number;
  titlePrefix?: React.ReactNode;
  hidePrice?: boolean;
};

export default function PosProductCard({
  product,
  onClick,
  canOverride = false,
  selectedCount = 0,
  titlePrefix,
  hidePrice = false,
  badge,
  noImageLabel,
  dict,
}: PosProductCardProps) {
  const [now] = useState(() => Date.now());
  const { isDeadlinePassed, isOutOfStock } = getProductPosAvailability(product, now);

  let resolvedBadge: { label: React.ReactNode; variant: BadgeProps["variant"] } | null = null;

  if (badge !== undefined) {
    resolvedBadge = badge ? { label: badge.label, variant: badge.variant ?? "secondary" } : null;
  } else if (dict) {
    if (isDeadlinePassed) {
      resolvedBadge = { label: dict.badge_deadline, variant: "secondary" };
    } else if (isOutOfStock) {
      resolvedBadge = { label: dict.badge_sold_out, variant: "secondary" };
    } else if (product.product_type === "event_ticket") {
      resolvedBadge = { label: dict.badge_named, variant: "secondary" };
    } else if (product.stock_type === "on_demand") {
      resolvedBadge = { label: dict.badge_on_demand, variant: "secondary" };
    } else if (product.stock_type === "limited") {
      const available = getProductStock(product);
      if (available !== null && available <= 5) {
        resolvedBadge = {
          label: dict.badge_units.replace("{count}", String(available)),
          variant: "secondary",
        };
      }
    }
  }

  const isDisabled = !canOverride && (isOutOfStock || isDeadlinePassed);
  const formattedPrice = formatMoney(product.price);
  const resolvedNoImageLabel = noImageLabel ?? dict.no_image;

  return (
    <button
      type="button"
      className={`${styles.card} ${isDisabled ? styles.cardDisabled : ""}`}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      aria-label={hidePrice ? product.name : `${product.name} - ${formattedPrice}`}>
      <ProductImage
        product={product}
        alt={product.name}
        width={300}
        height={400}
        wrapperClassName={styles.imageWrapper}
        wrapperEmptyClassName={styles.imageWrapperEmpty}
        imageClassName={styles.image}
        placeholderClassName={styles.placeholder}
        placeholderLabel={resolvedNoImageLabel}>
        {resolvedBadge && (
          <Badge variant={resolvedBadge.variant} size="sm" className={styles.badge}>
            {resolvedBadge.label}
          </Badge>
        )}
        {selectedCount > 0 && (
          <Badge variant="primary" size="sm" className={styles.countBadge}>
            {selectedCount}x
          </Badge>
        )}
      </ProductImage>

      <div className={styles.titleRow}>
        {titlePrefix}
        <h3 className={styles.name}>{product.name}</h3>
      </div>
      {!hidePrice && (
        <Text size="sm" variant="muted">
          {formattedPrice}
        </Text>
      )}
    </button>
  );
}
