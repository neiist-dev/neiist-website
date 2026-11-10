"use client";

import React, { useMemo } from "react";
import { Button, Tabs, Stack, EmptyState, ColorSwatch } from "@neiist/ui";
import { FiArrowLeft } from "react-icons/fi";
import { Product } from "@/types/shop/product";
import { Category } from "@/types/shop/category";
import PosProductCard from "@/components/shop/pos/PosProductCard";
import { isColorKey, splitNameHex, getItemImage } from "@/utils/shop/shopUtils";
import styles from "@/styles/components/shop/pos/PosCatalogGrid.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface PosCatalogGridProps {
  products: Product[];
  categories?: Category[] | string[];
  selectedCategory: string;
  onCategoryChange: (_category: string) => void;
  onProductCardClick: (_product: Product) => void;
  activeVariantProduct: Product | null;
  selectedVariantOptions: Record<string, string>;
  availableValuesForCurrentKey: string[];
  currentOptionKey: string | null;
  onSelectVariantOptionValue: (_val: string) => void;
  onVariantBack: () => void;
  canOverride?: boolean;
  filterAvailable?: boolean;
  getSelectedCount?: (_product: Product) => number;
  dict: Dictionary["pos"]["catalog"];
}

export default function PosCatalogGrid({
  products,
  categories = [],
  selectedCategory,
  onCategoryChange,
  onProductCardClick,
  activeVariantProduct,
  selectedVariantOptions,
  availableValuesForCurrentKey,
  currentOptionKey,
  onSelectVariantOptionValue,
  onVariantBack,
  canOverride = false,
  filterAvailable = true,
  getSelectedCount,
  dict,
}: PosCatalogGridProps) {
  const categoryTabs = useMemo(() => {
    const list: string[] =
      categories.length > 0
        ? categories.map((c) => (typeof c === "string" ? c : c.name))
        : (Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[]);

    const allTabs = [
      { id: "all", name: dict.all },
      ...list.map((catName) => ({ id: catName, name: catName })),
    ];

    return allTabs.map((tab) => {
      const items = products.filter((product) => {
        if (filterAvailable) {
          const isAvailableInPos =
            product.channels?.includes("pos") ||
            product.product_type === "merchandise" ||
            product.product_type === "event_ticket";
          if (!isAvailableInPos) return false;
        }
        return !(tab.id !== "all" && product.category !== tab.id);
      });

      return {
        id: tab.id,
        name: tab.name,
        content:
          items.length === 0 ? (
            <EmptyState title={dict.empty} />
          ) : (
            <div className={styles.productGrid}>
              {items.map((product) => (
                <PosProductCard
                  key={product.id}
                  product={product}
                  canOverride={canOverride}
                  selectedCount={getSelectedCount ? getSelectedCount(product) : 0}
                  onClick={() => onProductCardClick(product)}
                  dict={dict}
                />
              ))}
            </div>
          ),
      };
    });
  }, [
    categories,
    products,
    onProductCardClick,
    canOverride,
    filterAvailable,
    getSelectedCount,
    dict,
  ]);

  if (activeVariantProduct) {
    return (
      <Stack direction="column" gap="md">
        <Stack direction="row" gap="sm" align="center" wrap>
          <Button variant="ghost" size="sm" onClick={onVariantBack}>
            <FiArrowLeft />
            {Object.keys(selectedVariantOptions).length === 0
              ? dict.back_to_catalog.replace("{product}", activeVariantProduct.name)
              : dict.back}
          </Button>

          <Stack direction="row" gap="sm" align="center" wrap className={styles.variantBreadcrumbs}>
            <strong>{activeVariantProduct.name}</strong>
            {Object.entries(selectedVariantOptions).map(([key, val]) => {
              const isColor = isColorKey(key);
              const { name, hex } = isColor ? splitNameHex(val) : { name: val, hex: "" };
              return (
                <Stack key={key} direction="row" gap="sm" align="center">
                  <span>›</span>
                  {hex && (
                    <ColorSwatch
                      color={hex}
                      size="sm"
                      style={{ inlineSize: "0.75rem", blockSize: "0.75rem" }}
                      ariaLabel={name || hex}
                    />
                  )}
                  <span>{name || val}</span>
                </Stack>
              );
            })}
            {currentOptionKey && (
              <>
                <span>›</span>
                <span className={styles.crumbCurrentLevel}>
                  {dict.select_option.replace("{option}", currentOptionKey)}
                </span>
              </>
            )}
          </Stack>
        </Stack>

        <div className={styles.productGrid}>
          {availableValuesForCurrentKey.map((val) => {
            const isColor = currentOptionKey ? isColorKey(currentOptionKey) : false;
            const colorName = isColor ? splitNameHex(val).name : val;

            const sampleVariant = activeVariantProduct.variants?.find((v) => {
              const matchesPrior = Object.entries(selectedVariantOptions).every(
                ([k, priorVal]) => v.options?.[k] === priorVal
              );
              return (
                matchesPrior && Boolean(currentOptionKey && v.options?.[currentOptionKey] === val)
              );
            });

            const image = getItemImage(activeVariantProduct, sampleVariant);
            const priceModifier = Number(sampleVariant?.price_modifier || 0);
            const effectivePrice = Number(activeVariantProduct.price) + priceModifier;

            const cardItem: Product = {
              ...activeVariantProduct,
              id: sampleVariant?.id || activeVariantProduct.id,
              name: colorName || val,
              price: effectivePrice,
              images: image ? [image] : [],
              stock_quantity: sampleVariant?.stock_quantity,
              variants: [],
            };

            return (
              <PosProductCard
                key={val}
                product={cardItem}
                canOverride={canOverride}
                onClick={() => onSelectVariantOptionValue(val)}
                dict={dict}
              />
            );
          })}
        </div>
      </Stack>
    );
  }

  return <Tabs value={selectedCategory} onChange={onCategoryChange} tabs={categoryTabs} />;
}
