"use client";

import { useState, useMemo, useCallback } from "react";
import { Product } from "@/types/shop/product";
import {
  findItemVariant,
  getDistinctOptionValues,
  getProductOptionNames,
  matchesSelections,
} from "@/utils/shop/shopUtils";

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

  const optionKeys = useMemo(
    () => (activeVariantProduct ? getProductOptionNames(activeVariantProduct.variants) : []),
    [activeVariantProduct]
  );

  const currentKeyIndex = Object.keys(selectedVariantOptions).length;
  const currentOptionKey = optionKeys[currentKeyIndex];

  const availableValuesForCurrentKey = useMemo(() => {
    if (!activeVariantProduct || !currentOptionKey) return [];
    const activeVariants = activeVariantProduct.variants?.filter((v) => v.active !== false) || [];
    const matching = activeVariants.filter((v) =>
      matchesSelections(v.options, selectedVariantOptions)
    );
    return getDistinctOptionValues(matching, currentOptionKey);
  }, [activeVariantProduct, currentOptionKey, selectedVariantOptions]);

  const handleSelectVariantOptionValue = (val: string) => {
    if (!activeVariantProduct || !currentOptionKey) return;
    const nextSelections = {
      ...selectedVariantOptions,
      [currentOptionKey]: val,
    };

    if (currentKeyIndex + 1 >= optionKeys.length) {
      const matched = findItemVariant(activeVariantProduct, { variant_options: nextSelections });
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
      setSelectedVariantOptions(Object.fromEntries(entries.slice(0, -1)));
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
