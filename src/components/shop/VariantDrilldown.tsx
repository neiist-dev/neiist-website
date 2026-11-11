"use client";

import React from "react";
import { FiArrowLeft } from "react-icons/fi";
import { type BadgeProps, Button, ColorSwatch, Stack } from "@neiist/ui";
import PosProductCard from "@/components/shop/pos/PosProductCard";
import type { Dictionary } from "@/i18n/dictionaries";
import styles from "@/styles/components/shop/VariantDrilldown.module.css";
import type { Product, ProductVariant } from "@/types/shop/product";
import { unitPriceMoney } from "@/utils/shop/moneyUtils";
import { isColorKey, matchesSelections, splitNameHex } from "@/utils/shop/shopUtils";

type VariantDrilldownI18nProps =
  | {
      getBranchBadge: (
        _value: string,
        _matchingVariants: ProductVariant[]
      ) => { label: React.ReactNode; variant?: BadgeProps["variant"] } | null;
      noImageLabel: string;
      cardDict?: never;
    }
  | {
      getBranchBadge?: never;
      noImageLabel?: never;
      cardDict: Dictionary["pos"]["catalog"];
    };

export type VariantDrilldownProps = VariantDrilldownI18nProps & {
  product: Product;
  selectedOptions: Record<string, string>;
  currentOptionKey: string | null;
  availableValues: string[];
  onSelectValue: (_value: string) => void;
  onBack?: () => void;
  onCrumbClick?: (_depth: number) => void;
  backLabel?: string;
  currentLevelLabel?: string;
  headerRight?: React.ReactNode;
  renderLeaf?: () => React.ReactNode;
  canOverride?: boolean;
  hidePrice?: boolean;
};

export default function VariantDrilldown({
  product,
  selectedOptions,
  currentOptionKey,
  availableValues,
  onSelectValue,
  onBack,
  onCrumbClick,
  backLabel,
  currentLevelLabel,
  headerRight,
  renderLeaf,
  canOverride = false,
  hidePrice = false,
  getBranchBadge,
  noImageLabel,
  cardDict,
}: VariantDrilldownProps) {
  const selectedEntries = Object.entries(selectedOptions);
  const currentText = currentLevelLabel ?? currentOptionKey;

  const renderAncestorLabel = (label: string, depth: number) =>
    onCrumbClick ? (
      <Button
        type="button"
        variant="ghost"
        color="neutral"
        size="sm"
        className={styles.crumbButton}
        onClick={() => onCrumbClick(depth)}>
        {label}
      </Button>
    ) : (
      <span className={styles.crumbAncestor}>{label}</span>
    );

  return (
    <Stack direction="column" gap="md">
      <Stack direction="row" gap="sm" align="center" justify="between" wrap>
        <Stack direction="row" gap="sm" align="center" wrap>
          {onBack && backLabel && (
            <Button type="button" variant="ghost" size="sm" onClick={onBack}>
              <FiArrowLeft />
              {backLabel}
            </Button>
          )}

          <nav aria-label={product.name}>
            <Stack direction="row" gap="sm" align="center" wrap>
              {selectedEntries.length === 0 && !currentText ? (
                <span className={styles.crumbCurrent}>{product.name}</span>
              ) : (
                renderAncestorLabel(product.name, 0)
              )}

              {selectedEntries.map(([key, val], idx) => {
                const isColor = isColorKey(key);
                const { name, hex } = isColor ? splitNameHex(val) : { name: val, hex: "" };
                return (
                  <Stack key={key} direction="row" gap="sm" align="center">
                    <span className={styles.crumbAncestor}>›</span>
                    {hex && (
                      <ColorSwatch
                        color={hex}
                        size="sm"
                        style={{ inlineSize: "0.75rem", blockSize: "0.75rem" }}
                        ariaLabel={name || hex}
                      />
                    )}
                    {renderAncestorLabel(name || val, idx + 1)}
                  </Stack>
                );
              })}

              {currentText && (
                <Stack direction="row" gap="sm" align="center">
                  <span className={styles.crumbAncestor}>›</span>
                  <span className={styles.crumbCurrent}>{currentText}</span>
                </Stack>
              )}
            </Stack>
          </nav>
        </Stack>

        {headerRight}
      </Stack>

      {renderLeaf ? (
        renderLeaf()
      ) : (
        <div className={styles.productGrid}>
          {availableValues.map((val) => {
            const isColor = currentOptionKey ? isColorKey(currentOptionKey) : false;
            const { name, hex } = isColor ? splitNameHex(val) : { name: val, hex: "" };

            const matchingVariants = currentOptionKey
              ? product.variants.filter((v) =>
                  matchesSelections(v.options, { ...selectedOptions, [currentOptionKey]: val })
                )
              : [];

            const sampleVariant =
              matchingVariants.find((v) => v.images && v.images.length > 0) ?? matchingVariants[0];
            const images = sampleVariant?.images?.length
              ? Array.from(new Set([...sampleVariant.images, ...product.images]))
              : product.images;

            const cardItem: Product = {
              ...product,
              id: sampleVariant?.id || product.id,
              name: name || val,
              price: unitPriceMoney(product.price, sampleVariant?.price_modifier),
              images,
              stock_quantity: sampleVariant?.stock_quantity,
              variants: [],
            };

            const titlePrefix = hex ? (
              <ColorSwatch
                color={hex}
                size="sm"
                style={{ inlineSize: "0.875rem", blockSize: "0.875rem" }}
                ariaLabel={name || hex}
              />
            ) : undefined;

            const commonCardProps = {
              product: cardItem,
              canOverride,
              hidePrice,
              titlePrefix,
              onClick: () => onSelectValue(val),
            };

            return getBranchBadge ? (
              <PosProductCard
                key={val}
                {...commonCardProps}
                badge={getBranchBadge(val, matchingVariants)}
                noImageLabel={noImageLabel}
              />
            ) : (
              <PosProductCard key={val} {...commonCardProps} dict={cardDict} />
            );
          })}
        </div>
      )}
    </Stack>
  );
}
