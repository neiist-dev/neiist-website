"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { FaEdit } from "react-icons/fa";
import { FiMinus, FiPlus } from "react-icons/fi";
import {
  Badge,
  Button,
  ColorSwatch,
  ColumnDef,
  ConfirmDialog,
  DataTable,
  Divider,
  Drawer,
  Heading,
  Stack,
  Text,
} from "@neiist/ui";
import ProductImage from "@/components/shop/catalog/ProductImage";
import VariantDrilldown from "@/components/shop/VariantDrilldown";
import type { Dictionary } from "@/i18n/dictionaries";
import posCardStyles from "@/styles/components/shop/pos/PosProductCard.module.css";
import styles from "@/styles/components/shop/manage/InventoryStockDrawer.module.css";
import type { Product, ProductVariant, StockChangeInput } from "@/types/shop/product";
import { formatMoney, unitPriceMoney } from "@/utils/shop/moneyUtils";
import {
  formatVariantSimple,
  getDistinctOptionValues,
  getProductImages,
  getProductOptionNames,
  getProductStock,
  isColorKey,
  matchesSelections,
  normalizeOptionValue,
  splitNameHex,
} from "@/utils/shop/shopUtils";

interface InventoryStockDrawerProps {
  product: Product | null;
  onClose: () => void;
  onSave: (_productId: number, _changes: StockChangeInput[]) => Promise<void>;
  onEdit: (_productId: number) => void;
  dict: Dictionary["shop_management"];
}

type DraftEntry = {
  mode: "delta" | "set";
  quantity: number;
};

interface PendingDiff {
  key: string;
  label: string;
  from: number;
  to: number;
  change: StockChangeInput;
}

interface DrillStep {
  key: string;
  value: string;
}

export default function InventoryStockDrawer({
  product,
  onClose,
  onSave,
  onEdit,
  dict,
}: InventoryStockDrawerProps) {
  const [drafts, setDrafts] = useState<Record<string, DraftEntry>>({});
  const [drillPath, setDrillPath] = useState<DrillStep[]>([]);
  const [imgIndex, setImgIndex] = useState(0);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(() => new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isLimited = product?.stock_type === "limited";

  const optionNames = useMemo(
    () => (product ? getProductOptionNames(product.variants) : []),
    [product]
  );

  const allImages = useMemo(() => (product ? getProductImages(product) : []), [product]);

  const visibleThumbnails = useMemo(
    () =>
      allImages.map((src, index) => ({ src, index })).filter((item) => !brokenImages.has(item.src)),
    [allImages, brokenImages]
  );

  const selectedOptions = useMemo(
    () => Object.fromEntries(drillPath.map((s) => [s.key, s.value])),
    [drillPath]
  );

  const matchingVariants = useMemo(
    () =>
      product ? product.variants.filter((v) => matchesSelections(v.options, selectedOptions)) : [],
    [product, selectedOptions]
  );

  const currentLevelIdx = Math.min(drillPath.length, Math.max(0, optionNames.length - 1));
  const currentOptionKey = optionNames[currentLevelIdx] ?? null;
  const isLeafLevel = optionNames.length > 0 && currentLevelIdx === optionNames.length - 1;

  const availableValuesForCurrentKey = useMemo(
    () => (currentOptionKey ? getDistinctOptionValues(matchingVariants, currentOptionKey) : []),
    [currentOptionKey, matchingVariants]
  );

  const pendingDiffs = useMemo<PendingDiff[]>(() => {
    if (!product || !isLimited) return [];

    const toDiff = (
      key: string,
      label: string,
      from: number,
      variantId?: number
    ): PendingDiff | null => {
      const draft = drafts[key];
      if (!draft || draft.quantity === from) return null;
      const delta = draft.quantity - from;
      return {
        key,
        label,
        from,
        to: draft.quantity,
        change:
          draft.mode === "delta"
            ? { ...(variantId !== undefined ? { variantId } : {}), delta }
            : { ...(variantId !== undefined ? { variantId } : {}), set: draft.quantity },
      };
    };

    if (product.variants.length === 0) {
      const diff = toDiff("base", dict.stock_drawer.base_stock, product.stock_quantity ?? 0);
      return diff ? [diff] : [];
    }

    return product.variants
      .map((variant) => {
        const { text } = formatVariantSimple(variant.options, variant.label);
        return toDiff(
          String(variant.id),
          text || variant.sku || `#${variant.id}`,
          variant.stock_quantity ?? 0,
          variant.id
        );
      })
      .filter((d): d is PendingDiff => d !== null);
  }, [product, isLimited, drafts, dict.stock_drawer.base_stock]);

  const updateDraft = useCallback(
    (key: string, original: number, computeNext: (_prev?: DraftEntry) => DraftEntry) => {
      setDrafts((prev) => {
        const next = computeNext(prev[key]);
        if (next.quantity === original) {
          const rest = { ...prev };
          delete rest[key];
          return rest;
        }
        return { ...prev, [key]: next };
      });
    },
    []
  );

  const handleConfirmSave = async () => {
    if (!product || pendingDiffs.length === 0) return;
    setIsSaving(true);
    try {
      await onSave(
        product.id,
        pendingDiffs.map((d) => d.change)
      );
      setDrafts({});
      setConfirmOpen(false);
    } catch {
      // Error feedback is handled by caller
    } finally {
      setIsSaving(false);
    }
  };

  const renderStepper = useCallback(
    (key: string, original: number) => {
      const current = drafts[key]?.quantity ?? original;
      const delta = current - original;

      const stepBy = (step: number) =>
        updateDraft(key, original, (existing) => ({
          mode: existing?.mode === "set" ? "set" : "delta",
          quantity: Math.max(0, (existing?.quantity ?? original) + step),
        }));

      const setFromInput = (raw: string) => {
        const parsed = Number.parseInt(raw, 10);
        updateDraft(key, original, () => ({
          mode: "set",
          quantity: Number.isNaN(parsed) ? 0 : Math.max(0, parsed),
        }));
      };

      return (
        <Stack direction="row" align="center" gap="sm" wrap>
          <div className={styles.quantityBox}>
            <Button
              type="button"
              variant="ghost"
              color="neutral"
              size="sm"
              className={styles.iconBtn}
              disabled={isSaving || current <= 0}
              aria-label="-1"
              onClick={() => stepBy(-1)}>
              <FiMinus size={12} />
            </Button>
            <input
              type="number"
              min={0}
              step={1}
              className={styles.quantityInput}
              value={current}
              disabled={isSaving}
              aria-label={dict.stock_drawer.on_hand}
              onChange={(e) => setFromInput(e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              color="neutral"
              size="sm"
              className={styles.iconBtn}
              disabled={isSaving}
              aria-label="+1"
              onClick={() => stepBy(1)}>
              <FiPlus size={12} />
            </Button>
          </div>
          {delta !== 0 && (
            <Badge variant="primary" size="sm">
              {original} → {current} ({delta > 0 ? `+${delta}` : delta})
            </Badge>
          )}
        </Stack>
      );
    },
    [dict.stock_drawer.on_hand, drafts, isSaving, updateDraft]
  );

  const leafColumns = useMemo<ColumnDef<ProductVariant>[]>(() => {
    if (!product) return [];
    const cols: ColumnDef<ProductVariant>[] = [
      {
        id: "variant",
        header: currentOptionKey || dict.col_product,
        isCardHeader: true,
        cell: (variant) => {
          const rawLeafValue = currentOptionKey
            ? normalizeOptionValue(variant.options?.[currentOptionKey])
            : "";
          const isColor = currentOptionKey ? isColorKey(currentOptionKey) : false;
          const { name, hex } = isColor
            ? splitNameHex(rawLeafValue)
            : { name: rawLeafValue, hex: "" };
          const label =
            name || rawLeafValue || formatVariantSimple(variant.options, variant.label).text;
          const isInactive = !variant.active;

          return (
            <Stack
              direction="row"
              align="center"
              gap="sm"
              wrap
              className={isInactive ? styles.rowDisabled : undefined}>
              {hex && (
                <ColorSwatch
                  color={hex}
                  size="sm"
                  style={{ inlineSize: "0.875rem", blockSize: "0.875rem" }}
                  ariaLabel={name || hex}
                />
              )}
              <strong>{label}</strong>
              {variant.sku && (
                <Text size="sm" variant="muted" className={styles.noMargin}>
                  {variant.sku}
                </Text>
              )}
              {isInactive && (
                <Badge variant="outline" size="sm">
                  {dict.stock_drawer.variant_inactive_badge}
                </Badge>
              )}
            </Stack>
          );
        },
      },
      {
        id: "price",
        header: dict.col_price,
        align: isLimited ? "start" : "end",
        cell: (variant) => formatMoney(unitPriceMoney(product.price, variant.price_modifier)),
      },
    ];

    if (isLimited) {
      cols.push({
        id: "stock",
        header: dict.col_stock,
        align: "end",
        cell: (variant) => renderStepper(String(variant.id), variant.stock_quantity ?? 0),
      });
    }

    return cols;
  }, [
    currentOptionKey,
    dict.col_price,
    dict.col_product,
    dict.col_stock,
    dict.stock_drawer.variant_inactive_badge,
    isLimited,
    product,
    renderStepper,
  ]);

  const baseColumns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        id: "name",
        header: dict.col_product,
        isCardHeader: true,
        cell: () => <strong>{dict.stock_drawer.base_stock}</strong>,
      },
      {
        id: "price",
        header: dict.col_price,
        cell: (p) => formatMoney(p.price),
      },
      {
        id: "stock",
        header: dict.col_stock,
        align: "end",
        cell: (p) => renderStepper("base", p.stock_quantity ?? 0),
      },
    ],
    [dict.col_price, dict.col_product, dict.col_stock, dict.stock_drawer.base_stock, renderStepper]
  );

  return (
    <>
      <ConfirmDialog
        open={confirmOpen}
        title={dict.stock_drawer.confirm_save_title}
        message={
          product && (
            <div>
              <span>{dict.stock_drawer.confirm_save_intro.replace("{name}", product.name)}</span>
              <ul className={styles.confirmChangesList}>
                {pendingDiffs.map((diff) => {
                  const delta = diff.to - diff.from;
                  return (
                    <li key={diff.key}>
                      <strong>{diff.label}</strong>: {diff.from} → {diff.to} (
                      {delta > 0 ? `+${delta}` : delta})
                    </li>
                  );
                })}
              </ul>
            </div>
          )
        }
        confirmLabel={dict.confirm_dialog.confirm}
        cancelLabel={dict.confirm_dialog.cancel}
        onConfirm={() => void handleConfirmSave()}
        onCancel={() => setConfirmOpen(false)}
      />

      <Drawer
        open={Boolean(product)}
        onClose={onClose}
        title={product?.name}
        subtitle={dict.stock_drawer.subtitle}
        closeLabel={dict.stock_drawer.close}
        size="xl">
        {product && (
          <>
            <Drawer.Body>
              <Stack direction="column" gap="lg">
                <div className={styles.previewHeader}>
                  <Stack direction="column" gap="sm" className={styles.previewGallery}>
                    <ProductImage
                      product={product}
                      alt={product.name}
                      width={300}
                      height={400}
                      imageIndex={imgIndex}
                      onImageIndexChange={setImgIndex}
                      wrapperClassName={posCardStyles.imageWrapper}
                      wrapperEmptyClassName={posCardStyles.imageWrapperEmpty}
                      imageClassName={posCardStyles.image}
                      placeholderClassName={posCardStyles.placeholder}
                      placeholderLabel={dict.no_image}
                    />
                    {visibleThumbnails.length > 1 && (
                      <Stack direction="row" gap="sm" wrap>
                        {visibleThumbnails.map(({ src, index }) => (
                          <button
                            key={src}
                            type="button"
                            className={`${styles.previewThumbBtn} ${
                              imgIndex === index ? styles.previewThumbActive : ""
                            }`}
                            aria-current={imgIndex === index}
                            onClick={() => setImgIndex(index)}>
                            <Image
                              src={src}
                              alt=""
                              width={36}
                              height={36}
                              onError={() => setBrokenImages((prev) => new Set(prev).add(src))}
                            />
                          </button>
                        ))}
                      </Stack>
                    )}
                  </Stack>

                  <Stack direction="column" gap="sm" className={styles.truncate}>
                    <Heading level={4} className={styles.noMargin}>
                      {formatMoney(product.price)}
                    </Heading>
                    {product.description && (
                      <div className={styles.previewDescription}>
                        <ReactMarkdown
                          components={{
                            a: ({ ...props }) => (
                              <a {...props} target="_blank" rel="noopener noreferrer" />
                            ),
                          }}>
                          {product.description}
                        </ReactMarkdown>
                      </div>
                    )}
                    {!isLimited && (
                      <Text size="sm" variant="muted" className={styles.noMargin}>
                        {product.stock_type === "on_demand"
                          ? dict.stock_drawer.on_demand_hint
                          : dict.stock_drawer.untracked_hint}
                      </Text>
                    )}
                  </Stack>
                </div>

                <Divider />

                {product.variants.length === 0 ? (
                  isLimited && (
                    <DataTable
                      data={[product]}
                      columns={baseColumns}
                      getRowId={(p) => String(p.id)}
                      responsive="scroll"
                    />
                  )
                ) : (
                  <VariantDrilldown
                    product={product}
                    selectedOptions={selectedOptions}
                    currentOptionKey={currentOptionKey}
                    availableValues={availableValuesForCurrentKey}
                    onSelectValue={(value) => {
                      if (currentOptionKey) {
                        setDrillPath((prev) => [...prev, { key: currentOptionKey, value }]);
                      }
                    }}
                    onBack={
                      drillPath.length > 0
                        ? () => setDrillPath((prev) => prev.slice(0, -1))
                        : undefined
                    }
                    onCrumbClick={(depth) => setDrillPath((prev) => prev.slice(0, depth))}
                    backLabel={dict.stock_drawer.back}
                    headerRight={
                      isLimited && (
                        <Text size="sm" variant="muted" className={styles.noMargin}>
                          {dict.stock_drawer.total_active.replace(
                            "{count}",
                            String(getProductStock(product) ?? 0)
                          )}
                        </Text>
                      )
                    }
                    canOverride={true}
                    hidePrice={true}
                    noImageLabel={dict.no_image}
                    getBranchBadge={
                      isLimited
                        ? (_value, variants) => {
                            const total = variants.reduce(
                              (sum, v) =>
                                sum +
                                (v.active
                                  ? (drafts[String(v.id)]?.quantity ?? v.stock_quantity ?? 0)
                                  : 0),
                              0
                            );
                            const hasUnsaved = variants.some(
                              (v) => drafts[String(v.id)] !== undefined
                            );
                            return {
                              label: total,
                              variant: hasUnsaved ? "primary" : total > 0 ? "secondary" : "danger",
                            };
                          }
                        : () => null
                    }
                    renderLeaf={
                      isLeafLevel
                        ? () => (
                            <DataTable
                              data={matchingVariants}
                              columns={leafColumns}
                              getRowId={(v) => String(v.id)}
                              responsive="scroll"
                            />
                          )
                        : undefined
                    }
                  />
                )}
              </Stack>
            </Drawer.Body>

            <Drawer.Footer>
              <Stack
                direction="row"
                align="center"
                justify="between"
                gap="sm"
                className={styles.fullWidth}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onEdit(product.id);
                  }}>
                  <FaEdit size={14} /> {dict.edit}
                </Button>

                {isLimited && (
                  <Stack direction="row" align="center" gap="sm">
                    {pendingDiffs.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isSaving}
                        onClick={() => setDrafts({})}>
                        {dict.stock_drawer.reset}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={isSaving || pendingDiffs.length === 0}
                      onClick={() => setConfirmOpen(true)}>
                      {dict.stock_drawer.save_changes}
                      {pendingDiffs.length > 0 ? ` (${pendingDiffs.length})` : ""}
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Drawer.Footer>
          </>
        )}
      </Drawer>
    </>
  );
}
