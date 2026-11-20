"use client";

import { useState, useMemo, useEffect, Dispatch, SetStateAction } from "react";
import { FaPlus, FaTrash, FaLayerGroup } from "react-icons/fa";
import { Input, ToggleSwitch } from "@neiist/ui";
import VariantOptionsEditor from "./VariantOptionsEditor";
import { isColorKey, joinNameHex, splitNameHex } from "@/utils/shop/shopUtils";
import { ItemCard } from "./ItemCard";
import { ImageGrid } from "./ImageGrid";
import {
  VariantDefinition,
  VariantForm,
  GroupImages,
  GroupSlot,
  emptyGroupSlot,
  slotImages,
  optValMatches,
  ImageFile,
} from "@/hooks/shop/manage/product-form/useProductForm";
import styles from "@/styles/components/shop/manage/ProductForm.module.css";
import type { Dictionary } from "@/i18n/dictionaries";
import { StockType } from "@/types/shop/product";

const MAX_VARIANTS = 3;

interface VariantsSectionProps {
  variantDefinitions: VariantDefinition[];
  setVariantDefinitions: Dispatch<SetStateAction<VariantDefinition[]>>;
  variants: VariantForm[];
  setVariants: Dispatch<SetStateAction<VariantForm[]>>;
  groupImages: GroupImages;
  setGroupImages: Dispatch<SetStateAction<GroupImages>>;
  hasVariants: boolean;
  basePrice: number;
  stockType: StockType;
  dict: Dictionary["shop"]["product_form"];
}

export function VariantsSection({
  variantDefinitions,
  setVariantDefinitions,
  variants,
  setVariants,
  groupImages,
  setGroupImages,
  hasVariants,
  basePrice,
  stockType,
  dict,
}: VariantsSectionProps) {
  const [activeTab, setActiveTab] = useState<"__groups__" | "__combos__">("__groups__");
  const [showSecondaryGroups, setShowSecondaryGroups] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const optionTypes = useMemo(
    () => variantDefinitions.map((d) => d.name).filter(Boolean),
    [variantDefinitions]
  );

  const groupKeys = useMemo(
    () =>
      variantDefinitions.flatMap((def) => {
        if (!def.name) return [];
        return def.values.map((val) => {
          const isStr = typeof val === "string";
          const strVal = isStr ? val : joinNameHex(val.name, val.color);
          const raw = isColorKey(def.name) && isStr ? splitNameHex(val) : null;
          return {
            key: `${def.name}::${strVal}`,
            type: def.name,
            val: strVal,
            hex: raw?.hex ?? (!isStr ? val.color : undefined),
            label: raw?.name ?? raw?.hex ?? (!isStr ? val.name : val),
          };
        });
      }),
    [variantDefinitions]
  );

  const primaryGroupType = variantDefinitions[0]?.name?.trim() ?? groupKeys[0]?.type ?? "";
  const visibleGroups = showSecondaryGroups
    ? groupKeys
    : groupKeys.filter((g) => g.type === primaryGroupType);
  const secondaryGroupsCount = groupKeys.filter((g) => g.type !== primaryGroupType).length;

  useEffect(() => {
    const validTabs: Array<"__groups__" | "__combos__"> = [
      ...(groupKeys.length ? (["__groups__"] as const) : []),
      ...(hasVariants ? (["__combos__"] as const) : []),
    ];
    if (validTabs.length && !validTabs.includes(activeTab)) {
      setActiveTab(validTabs[0]);
    }
  }, [groupKeys.length, hasVariants, activeTab]);

  const addGroupImage = (g: (typeof groupKeys)[0], slot: GroupSlot, file: File) => {
    const img: ImageFile = { file, preview: URL.createObjectURL(file) };
    setGroupImages((p) => ({ ...p, [g.key]: { ...slot, newFiles: [...slot.newFiles, img] } }));
    setVariants((p) =>
      p.map((v) =>
        optValMatches(g.type, v.options[g.type] ?? "", g.val)
          ? { ...v, newImages: [...v.newImages, img] }
          : v
      )
    );
  };

  const removeGroupImage = (g: (typeof groupKeys)[0], slot: GroupSlot, i: number) => {
    const isExisting = i < slot.existing.length;
    setGroupImages((p) => ({
      ...p,
      [g.key]: isExisting
        ? { ...slot, existing: slot.existing.filter((_, idx) => idx !== i) }
        : {
            ...slot,
            newFiles: slot.newFiles.filter((_, idx) => idx !== i - slot.existing.length),
          },
    }));
    setVariants((p) =>
      p.map((v) => {
        if (!optValMatches(g.type, v.options[g.type] ?? "", g.val)) return v;
        return isExisting
          ? { ...v, existingImages: v.existingImages.filter((img) => img !== slot.existing[i]) }
          : { ...v, newImages: v.newImages.filter((_, k) => k !== i - slot.existing.length) };
      })
    );
  };

  return (
    <div className={styles.stackBlock}>
      <div className={styles.sectionTitle}>
        <span className={styles.sectionTitleIcon}>
          <FaLayerGroup />
        </span>
        <span>{dict.variants_title}</span>
      </div>

      <div className={styles.col}>
        {variantDefinitions.map((def, idx) => (
          <div key={def.id} className={styles.variantDefRow}>
            <input
              className={styles.field}
              value={def.name}
              onChange={(e) =>
                setVariantDefinitions((p) =>
                  p.map((d, i) => (i === idx ? { ...d, name: e.target.value } : d))
                )
              }
              placeholder={dict.variant_name_placeholder}
            />
            <div className={styles.variantEditorWrap}>
              <VariantOptionsEditor
                value={def.values}
                onChange={(v) =>
                  setVariantDefinitions((p) =>
                    p.map((d, i) => (i === idx ? { ...d, values: v } : d))
                  )
                }
                placeholder={
                  isColorKey(def.name)
                    ? dict.color_value_placeholder
                    : dict.regular_value_placeholder
                }
                isColor={isColorKey(def.name)}
              />
            </div>
            <button
              type="button"
              className={styles.btnDanger}
              onClick={() => setVariantDefinitions((p) => p.filter((_, i) => i !== idx))}
              aria-label="Remover variante">
              <FaTrash />
            </button>
          </div>
        ))}
        {variantDefinitions.length < MAX_VARIANTS && (
          <button
            type="button"
            className={`${styles.btnPrimary} ${styles.addVariantButton}`}
            onClick={() =>
              setVariantDefinitions((p) => [
                ...p,
                { id: Math.random().toString(), name: "", values: [] },
              ])
            }>
            <FaPlus size={12} /> {dict.add_variant_button}
          </button>
        )}
      </div>

      {(hasVariants || groupKeys.length > 0) && (
        <div className={styles.tabsBlock}>
          <div className={styles.tabBar}>
            {groupKeys.length > 0 && (
              <button
                type="button"
                className={`${styles.tabButton} ${activeTab === "__groups__" ? styles.activeTab : ""}`}
                onClick={() => setActiveTab("__groups__")}>
                {dict.groups_tab}
              </button>
            )}
            {hasVariants && (
              <button
                type="button"
                className={`${styles.tabButton} ${activeTab === "__combos__" ? styles.activeTab : ""}`}
                onClick={() => setActiveTab("__combos__")}>
                {dict.combos_tab}{" "}
                <span className={styles.badge}>{variants.filter((v) => v.active).length}</span>
              </button>
            )}
          </div>

          <div className={styles.col}>
            {activeTab === "__groups__" && (
              <>
                {groupKeys.length > 0 && secondaryGroupsCount > 0 && (
                  <div className={styles.inputRow}>
                    <span className={styles.hint}>
                      {dict.show_secondary_groups.replace("{count}", String(secondaryGroupsCount))}
                    </span>
                    <ToggleSwitch
                      checked={showSecondaryGroups}
                      onChange={setShowSecondaryGroups}
                      aria-label={dict.show_secondary_groups_aria}
                    />
                  </div>
                )}
                {visibleGroups.map((g) => {
                  const slot = groupImages[g.key] ?? emptyGroupSlot();
                  return (
                    <ItemCard
                      key={g.key}
                      isOpen={expandedKey === g.key}
                      onToggle={() => setExpandedKey((p) => (p === g.key ? null : g.key))}
                      title={g.label}
                      typeTag={!g.hex ? g.type[0].toUpperCase() : null}
                      hex={g.hex}
                      meta={
                        slot.price_modifier
                          ? `${(basePrice + slot.price_modifier).toFixed(2)}€`
                          : null
                      }
                      badge={slotImages(slot).length}>
                      <div className={styles.row}>
                        <div className={styles.fieldWrap}>
                          <span className={styles.subLabel}>{dict.price_modifier_label}</span>
                          <Input
                            type="number"
                            step="0.01"
                            value={slot.price_modifier || ""}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setGroupImages((p) => ({
                                ...p,
                                [g.key]: { ...slot, price_modifier: val },
                              }));
                              setVariants((p) =>
                                p.map((v) =>
                                  optValMatches(g.type, v.options[g.type] ?? "", g.val)
                                    ? { ...v, price_modifier: val }
                                    : v
                                )
                              );
                            }}
                          />
                        </div>
                      </div>
                      <ImageGrid
                        hint={dict.variant_images_hint}
                        images={slotImages(slot)}
                        onAdd={(f) => addGroupImage(g, slot, f)}
                        onRemove={(i) => removeGroupImage(g, slot, i)}
                      />
                    </ItemCard>
                  );
                })}
              </>
            )}

            {activeTab === "__combos__" &&
              variants.map((v, i) => {
                const vId = v.id ? String(v.id) : `new-${i}`;
                const imgs = [...v.existingImages, ...v.newImages.map((f) => f.preview)];
                const colKey = optionTypes.find(isColorKey);
                const updateVariant = (updates: Partial<VariantForm>) =>
                  setVariants((p) => p.map((vr, idx) => (idx === i ? { ...vr, ...updates } : vr)));

                return (
                  <ItemCard
                    key={vId}
                    isOpen={expandedKey === vId}
                    onToggle={() => setExpandedKey((p) => (p === vId ? null : vId))}
                    isActive={v.active}
                    onActiveToggle={() => updateVariant({ active: !v.active })}
                    title={optionTypes
                      .map((t) =>
                        isColorKey(t)
                          ? splitNameHex(v.options[t]).name || v.options[t]
                          : v.options[t]
                      )
                      .join(" • ")}
                    hex={colKey ? splitNameHex(v.options[colKey]).hex : undefined}
                    badge={imgs.length}
                    meta={
                      v.price_modifier || v.stock_quantity
                        ? `${v.price_modifier ? (basePrice + v.price_modifier).toFixed(2) + "€ " : ""}${v.stock_quantity ? v.stock_quantity + "un" : ""}`
                        : null
                    }>
                    <div className={styles.row}>
                      <div className={styles.fieldWrap}>
                        <span className={styles.subLabel}>{dict.price_modifier_label}</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={v.price_modifier || ""}
                          onChange={(e) =>
                            updateVariant({ price_modifier: Number(e.target.value) })
                          }
                          disabled={!v.active}
                        />
                      </div>
                      <div className={styles.fieldWrap}>
                        <span className={styles.subLabel}>{dict.combo_stock_label}</span>
                        <Input
                          type="number"
                          value={v.stock_quantity || ""}
                          onChange={(e) =>
                            updateVariant({ stock_quantity: Number(e.target.value) })
                          }
                          disabled={!v.active || stockType === "on_demand"}
                        />
                      </div>
                    </div>
                    <ImageGrid
                      hint={dict.specific_images_hint}
                      images={imgs}
                      onAdd={(f) =>
                        updateVariant({
                          newImages: [...v.newImages, { file: f, preview: URL.createObjectURL(f) }],
                        })
                      }
                      onRemove={(idx) =>
                        idx < v.existingImages.length
                          ? updateVariant({
                              existingImages: v.existingImages.filter((_, k) => k !== idx),
                            })
                          : updateVariant({
                              newImages: v.newImages.filter(
                                (_, k) => k !== idx - v.existingImages.length
                              ),
                            })
                      }
                    />
                  </ItemCard>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
