"use client";

import React, { useState } from "react";
import { Badge, Text } from "@neiist/ui";
import { Product } from "@/types/shop/product";
import ProductImage from "@/components/shop/catalog/ProductImage";
import { formatMoney } from "@/utils/shop/moneyUtils";
import { getProductPosAvailability } from "@/utils/shop/posUtils";
import styles from "@/styles/components/shop/pos/PosProductCard.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface PosProductCardProps {
  product: Product;
  onClick: () => void;
  canOverride?: boolean;
  selectedCount?: number;
  dict: Dictionary["pos"]["catalog"];
}

export default function PosProductCard({
  product,
  onClick,
  canOverride = false,
  selectedCount = 0,
  dict,
}: PosProductCardProps) {
  const [now] = useState(() => Date.now());
  const { isDeadlinePassed, isOutOfStock } = getProductPosAvailability(product, now);

  let microBadge: string | null = null;

  if (isDeadlinePassed) {
    microBadge = dict.badge_deadline;
  } else if (isOutOfStock) {
    microBadge = dict.badge_sold_out;
  } else if (product.product_type === "event_ticket") {
    microBadge = dict.badge_named;
  } else if (product.stock_type === "on_demand") {
    microBadge = dict.badge_on_demand;
  } else if (
    product.stock_type === "limited" &&
    product.stock_quantity !== null &&
    product.stock_quantity !== undefined &&
    product.stock_quantity <= 5
  ) {
    microBadge = dict.badge_units.replace("{count}", String(product.stock_quantity));
  }

  const isDisabled = !canOverride && (isOutOfStock || isDeadlinePassed);
  const formattedPrice = formatMoney(product.price);

  return (
    <button
      type="button"
      className={`${styles.card} ${isDisabled ? styles.cardDisabled : ""}`}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      aria-label={`${product.name} - ${formattedPrice}`}>
      <ProductImage
        product={product}
        alt={product.name}
        width={300}
        height={400}
        wrapperClassName={styles.imageWrapper}
        wrapperEmptyClassName={styles.imageWrapperEmpty}
        imageClassName={styles.image}
        placeholderClassName={styles.placeholder}
        placeholderLabel={dict.no_image}>
        {microBadge && (
          <Badge variant="secondary" size="sm" className={styles.badge}>
            {microBadge}
          </Badge>
        )}
        {selectedCount > 0 && (
          <Badge variant="primary" size="sm" className={styles.countBadge}>
            {selectedCount}x
          </Badge>
        )}
      </ProductImage>

      <h3 className={styles.name}>{product.name}</h3>
      <Text size="sm" variant="muted">
        {formattedPrice}
      </Text>
    </button>
  );
}
