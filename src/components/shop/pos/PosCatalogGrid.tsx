"use client";

import React, { useMemo } from "react";
import { Tabs, EmptyState } from "@neiist/ui";
import { Product } from "@/types/shop/product";
import { Category } from "@/types/shop/category";
import PosProductCard from "@/components/shop/pos/PosProductCard";
import VariantDrilldown from "@/components/shop/VariantDrilldown";
import styles from "@/styles/components/shop/VariantDrilldown.module.css";
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
    const isRoot = Object.keys(selectedVariantOptions).length === 0;
    return (
      <VariantDrilldown
        product={activeVariantProduct}
        selectedOptions={selectedVariantOptions}
        currentOptionKey={currentOptionKey}
        availableValues={availableValuesForCurrentKey}
        onSelectValue={onSelectVariantOptionValue}
        onBack={onVariantBack}
        backLabel={isRoot ? dict.back_to_catalog : dict.back}
        currentLevelLabel={
          currentOptionKey ? dict.select_option.replace("{option}", currentOptionKey) : undefined
        }
        canOverride={canOverride}
        cardDict={dict}
      />
    );
  }

  return <Tabs value={selectedCategory} onChange={onCategoryChange} tabs={categoryTabs} />;
}
