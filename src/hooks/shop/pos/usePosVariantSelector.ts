"use client";

import { useState, useMemo, useCallback } from "react";
import { Product } from "@/types/shop/product";

export function usePosVariantSelector(
  addToCart: (_product: Product, _variant: Product["variants"][0] | null) => void
) {
  const [activeVariantProduct, setActiveVariantProduct] = useState<Product | null>(null);
  const [selectedVariantOptions, setSelectedVariantOptions] = useState<Record<string, string>>({});

  const handleProductCardClick = useCallback(
    (product: Product) => {
      const activeVariants = product.variants?.filter((v) => v.active !== false) || [];
      if (activeVariants.length > 0) {
        setActiveVariantProduct(product);
        setSelectedVariantOptions({});
      } else {
        addToCart(product, null);
      }
    },
    [addToCart]
  );

  const optionKeys = useMemo(() => {
    if (!activeVariantProduct) return [];
    const keys = new Set<string>();
    activeVariantProduct.variants?.forEach((v) => {
      if (v.options) Object.keys(v.options).forEach((k) => keys.add(k));
    });
    return Array.from(keys);
  }, [activeVariantProduct]);

  const currentKeyIndex = Object.keys(selectedVariantOptions).length;
  const currentOptionKey = optionKeys[currentKeyIndex];

  const availableValuesForCurrentKey = useMemo(() => {
    if (!activeVariantProduct || !currentOptionKey) return [];
    const activeVariants = activeVariantProduct.variants?.filter((v) => v.active !== false) || [];
    const values = new Set<string>();
    activeVariants.forEach((v) => {
      const matchesPrior = Object.entries(selectedVariantOptions).every(
        ([key, val]) => v.options?.[key] === val
      );
      if (matchesPrior && v.options?.[currentOptionKey]) values.add(v.options[currentOptionKey]);
    });
    return Array.from(values);
  }, [activeVariantProduct, currentOptionKey, selectedVariantOptions]);

  const handleSelectVariantOptionValue = (val: string) => {
    if (!activeVariantProduct || !currentOptionKey) return;
    const nextSelections = {
      ...selectedVariantOptions,
      [currentOptionKey]: val,
    };

    if (currentKeyIndex + 1 >= optionKeys.length) {
      const matched = activeVariantProduct.variants?.find((v) =>
        Object.entries(nextSelections).every(([k, vVal]) => v.options?.[k] === vVal)
      );
      addToCart(activeVariantProduct, matched || null);
      setActiveVariantProduct(null);
      setSelectedVariantOptions({});
    } else {
      setSelectedVariantOptions(nextSelections);
    }
  };

  const handleVariantBack = () => {
    const entries = Object.entries(selectedVariantOptions);
    if (entries.length === 0) {
      setActiveVariantProduct(null);
      setSelectedVariantOptions({});
    } else {
      const previous = Object.fromEntries(entries.slice(0, -1));
      setSelectedVariantOptions(previous);
    }
  };

  return {
    activeVariantProduct,
    selectedVariantOptions,
    optionKeys,
    currentOptionKey,
    availableValuesForCurrentKey,
    handleProductCardClick,
    handleSelectVariantOptionValue,
    handleVariantBack,
  };
}
