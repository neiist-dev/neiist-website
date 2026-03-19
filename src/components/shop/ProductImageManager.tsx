"use client";
import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { FaUpload, FaTrash, FaChevronLeft, FaChevronRight, FaPlus } from "react-icons/fa";
import styles from "@/styles/components/shop//ProductImageManager.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ImageFile = { file: File; preview: string };

/** Images scoped to a single option value, e.g. { "Colour": { "Red": [...] } } */
export type GroupImages = {
  [optionKey: string]: {
    [optionValue: string]: {
      existing: string[];
      newFiles: ImageFile[];
    };
  };
};

/** Images scoped to a full variant combination, keyed by variantId */
export type ComboImages = {
  [variantId: string]: {
    existing: string[];
    newFiles: ImageFile[];
  };
};

export type VariantOption = { [key: string]: string };

export type VariantRef = {
  id: string; // stable ID e.g. "new-0" or actual DB id as string
  options: VariantOption;
};

interface ProductImageManagerProps {
  /** Global product-level images */
  existingProductImages: string[];
  newProductImages: ImageFile[];
  onProductImagesChange: (existing: string[], newFiles: ImageFile[]) => void;

  /** Option type names, e.g. ["Colour", "Size"] */
  optionTypes: string[];

  /** All variant combinations */
  variants: VariantRef[];

  /** isColorKey helper imported from shopUtils */
  isColorKey: (key: string) => boolean;
  /** splitNameHex helper */
  splitNameHex: (raw: string) => { name: string; hex: string };

  /** Variant-level image state (lifted up so parent can submit) */
  groupImages: GroupImages;
  onGroupImagesChange: (next: GroupImages) => void;

  comboImages: ComboImages;
  onComboImagesChange: (next: ComboImages) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function variantLabel(v: VariantRef, optionTypes: string[]): string {
  return optionTypes.map((t) => v.options[t] || "?").join(" / ");
}

function allImagesForSlot(slot: { existing: string[]; newFiles: ImageFile[] }): string[] {
  return [...slot.existing, ...slot.newFiles.map((f) => f.preview)];
}

// ─── Sub-component: image grid ───────────────────────────────────────────────

function ImageGrid({
  images,
  onAdd,
  onRemove,
  compact = false,
}: {
  images: string[];
  onAdd: (file: File) => void;
  onRemove: (index: number) => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={`${styles.imageGrid} ${compact ? styles.imageGridCompact : ""}`}>
      {images.map((src, idx) => (
        <div key={idx} className={styles.imgSlot}>
          <Image src={src} alt="" fill className={styles.imgThumb} />
          <button
            type="button"
            className={styles.removeBtn}
            onClick={() => onRemove(idx)}
            aria-label="Remove image">
            <FaTrash size={9} />
          </button>
          <span className={styles.imgIndex}>{idx + 1}</span>
        </div>
      ))}
      <button
        type="button"
        className={styles.addSlot}
        onClick={() => inputRef.current?.click()}
        aria-label="Add image">
        <FaPlus size={14} />
        <span>Add</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onAdd(f);
            e.target.value = "";
          }}
        />
      </button>
    </div>
  );
}

// ─── Sub-component: image carousel (product-level preview) ───────────────────

function ImageCarousel({
  images,
  onAdd,
  onRemove,
}: {
  images: string[];
  onAdd: (file: File) => void;
  onRemove: (index: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const safeIdx = Math.min(idx, Math.max(0, images.length - 1));

  return (
    <div className={styles.carousel}>
      <div className={styles.carouselStage}>
        {images.length > 0 ? (
          <>
            <Image
              key={safeIdx}
              src={images[safeIdx]}
              alt="Product"
              fill
              className={styles.carouselImg}
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className={`${styles.carouselNav} ${styles.carouselNavLeft}`}
                  onClick={() => setIdx((p) => Math.max(0, p - 1))}>
                  <FaChevronLeft size={12} />
                </button>
                <button
                  type="button"
                  className={`${styles.carouselNav} ${styles.carouselNavRight}`}
                  onClick={() => setIdx((p) => Math.min(images.length - 1, p + 1))}>
                  <FaChevronRight size={12} />
                </button>
                <div className={styles.carouselDots}>
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`${styles.dot} ${i === safeIdx ? styles.dotActive : ""}`}
                      onClick={() => setIdx(i)}
                    />
                  ))}
                </div>
              </>
            )}
            <button
              type="button"
              className={styles.carouselRemove}
              onClick={() => {
                onRemove(safeIdx);
                setIdx(Math.max(0, safeIdx - 1));
              }}>
              <FaTrash size={11} /> Remove
            </button>
          </>
        ) : (
          <div className={styles.carouselEmpty}>
            <FaUpload size={22} style={{ opacity: 0.3 }} />
            <span>No images yet</span>
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      <div className={styles.thumbStrip}>
        {images.map((src, i) => (
          <button
            key={i}
            type="button"
            className={`${styles.thumbBtn} ${i === safeIdx ? styles.thumbBtnActive : ""}`}
            onClick={() => setIdx(i)}>
            <Image src={src} alt="" fill className={styles.thumbImg} />
          </button>
        ))}
        <button type="button" className={styles.thumbAdd} onClick={() => inputRef.current?.click()}>
          <FaUpload size={12} />
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                onAdd(f);
                setIdx(images.length); // jump to newly added
              }
              e.target.value = "";
            }}
          />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Scope = "group" | "combo";

export default function ProductImageManager({
  existingProductImages,
  newProductImages,
  onProductImagesChange,
  optionTypes,
  variants,
  isColorKey,
  splitNameHex,
  groupImages,
  onGroupImagesChange,
  comboImages,
  onComboImagesChange,
}: ProductImageManagerProps) {
  const [scope, setScope] = useState<Scope>("group");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // ── product-level handlers ──────────────────────────────────────────────────
  const allProductImages = [...existingProductImages, ...newProductImages.map((f) => f.preview)];

  const handleProductAdd = (file: File) => {
    const preview = URL.createObjectURL(file);
    onProductImagesChange(existingProductImages, [...newProductImages, { file, preview }]);
  };

  const handleProductRemove = (index: number) => {
    if (index < existingProductImages.length) {
      onProductImagesChange(
        existingProductImages.filter((_, i) => i !== index),
        newProductImages
      );
    } else {
      const ni = index - existingProductImages.length;
      URL.revokeObjectURL(newProductImages[ni].preview);
      onProductImagesChange(
        existingProductImages,
        newProductImages.filter((_, i) => i !== ni)
      );
    }
  };

  // ── group image handlers ────────────────────────────────────────────────────
  function getGroupSlot(optKey: string, optVal: string) {
    return groupImages?.[optKey]?.[optVal] ?? { existing: [], newFiles: [] };
  }

  function setGroupSlot(
    optKey: string,
    optVal: string,
    slot: { existing: string[]; newFiles: ImageFile[] }
  ) {
    onGroupImagesChange({
      ...groupImages,
      [optKey]: {
        ...(groupImages?.[optKey] ?? {}),
        [optVal]: slot,
      },
    });
  }

  const handleGroupAdd = (optKey: string, optVal: string, file: File) => {
    const slot = getGroupSlot(optKey, optVal);
    setGroupSlot(optKey, optVal, {
      ...slot,
      newFiles: [...slot.newFiles, { file, preview: URL.createObjectURL(file) }],
    });
  };

  const handleGroupRemove = (optKey: string, optVal: string, index: number) => {
    const slot = getGroupSlot(optKey, optVal);
    const all = allImagesForSlot(slot);
    if (index < slot.existing.length) {
      setGroupSlot(optKey, optVal, {
        ...slot,
        existing: slot.existing.filter((_, i) => i !== index),
      });
    } else {
      const ni = index - slot.existing.length;
      URL.revokeObjectURL(slot.newFiles[ni].preview);
      setGroupSlot(optKey, optVal, { ...slot, newFiles: slot.newFiles.filter((_, i) => i !== ni) });
    }
  };

  // ── combo image handlers ────────────────────────────────────────────────────
  function getComboSlot(vid: string) {
    return comboImages?.[vid] ?? { existing: [], newFiles: [] };
  }

  function setComboSlot(vid: string, slot: { existing: string[]; newFiles: ImageFile[] }) {
    onComboImagesChange({ ...comboImages, [vid]: slot });
  }

  const handleComboAdd = (vid: string, file: File) => {
    const slot = getComboSlot(vid);
    setComboSlot(vid, {
      ...slot,
      newFiles: [...slot.newFiles, { file, preview: URL.createObjectURL(file) }],
    });
  };

  const handleComboRemove = (vid: string, index: number) => {
    const slot = getComboSlot(vid);
    if (index < slot.existing.length) {
      setComboSlot(vid, { ...slot, existing: slot.existing.filter((_, i) => i !== index) });
    } else {
      const ni = index - slot.existing.length;
      URL.revokeObjectURL(slot.newFiles[ni].preview);
      setComboSlot(vid, { ...slot, newFiles: slot.newFiles.filter((_, i) => i !== ni) });
    }
  };

  // ── unique option values ────────────────────────────────────────────────────
  const optionValues: { [key: string]: string[] } = {};
  for (const optKey of optionTypes) {
    const seen = new Set<string>();
    for (const v of variants) {
      const raw = v.options[optKey] || "";
      if (raw && !seen.has(raw)) {
        seen.add(raw);
        optionValues[optKey] = [...(optionValues[optKey] ?? []), raw];
      }
    }
  }

  // ── image count helpers ─────────────────────────────────────────────────────
  function groupCount(optKey: string, optVal: string) {
    const s = getGroupSlot(optKey, optVal);
    return s.existing.length + s.newFiles.length;
  }
  function comboCount(vid: string) {
    const s = getComboSlot(vid);
    return s.existing.length + s.newFiles.length;
  }

  const hasVariants = variants.length > 0;

  return (
    <div className={styles.root}>
      {/* ── PRODUCT IMAGES ─────────────────────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionTitle}>Product images</span>
          <span className={styles.sectionHint}>
            Default gallery — shown when no variant is selected
          </span>
        </div>
        <ImageCarousel
          images={allProductImages}
          onAdd={handleProductAdd}
          onRemove={handleProductRemove}
        />
      </div>

      {/* ── VARIANT IMAGES ─────────────────────────────────────────────────── */}
      {hasVariants && (
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTitle}>Variant images</span>
            <span className={styles.sectionHint}>
              Override gallery for a specific variant or option group
            </span>
          </div>

          {/* Priority explanation */}
          <div className={styles.priorityBanner}>
            <span className={styles.priorityLabel}>Image priority</span>
            <div className={styles.priorityChain}>
              <span className={styles.priorityChip + " " + styles.chipHigh}>Combination</span>
              <span className={styles.priorityArrow}>›</span>
              <span className={styles.priorityChip + " " + styles.chipMid}>Option group</span>
              <span className={styles.priorityArrow}>›</span>
              <span className={styles.priorityChip + " " + styles.chipLow}>Product</span>
            </div>
          </div>

          {/* Scope tabs */}
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${scope === "group" ? styles.tabActive : ""}`}
              onClick={() => {
                setScope("group");
                setSelectedKey(null);
              }}>
              By option group
            </button>
            <button
              type="button"
              className={`${styles.tab} ${scope === "combo" ? styles.tabActive : ""}`}
              onClick={() => {
                setScope("combo");
                setSelectedKey(null);
              }}>
              By combination
            </button>
          </div>

          {/* ── GROUP scope ─────────────────────────────────────────────────── */}
          {scope === "group" && (
            <div className={styles.variantLayout}>
              {/* Left: option value list */}
              <div className={styles.variantList}>
                {optionTypes.flatMap((optKey) =>
                  (optionValues[optKey] ?? []).map((optVal) => {
                    const key = `${optKey}::${optVal}`;
                    const raw = isColorKey(optKey) ? splitNameHex(optVal) : null;
                    const count = groupCount(optKey, optVal);
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`${styles.variantItem} ${selectedKey === key ? styles.variantItemActive : ""}`}
                        onClick={() => setSelectedKey(key === selectedKey ? null : key)}>
                        <div className={styles.variantItemLeft}>
                          {raw?.hex && (
                            <span className={styles.colorDot} style={{ background: raw.hex }} />
                          )}
                          <div>
                            <div className={styles.variantItemKey}>{optKey}</div>
                            <div className={styles.variantItemVal}>
                              {raw ? raw.name || raw.hex : optVal}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`${styles.countBadge} ${count > 0 ? styles.countBadgeActive : ""}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Right: image editor for selected group */}
              <div className={styles.variantEditor}>
                {selectedKey ? (
                  (() => {
                    const [optKey, optVal] = selectedKey.split("::");
                    const raw = isColorKey(optKey) ? splitNameHex(optVal) : null;
                    const slot = getGroupSlot(optKey, optVal);
                    const imgs = allImagesForSlot(slot);
                    return (
                      <>
                        <div className={styles.editorHeader}>
                          {raw?.hex && (
                            <span className={styles.colorDotLg} style={{ background: raw.hex }} />
                          )}
                          <div>
                            <div className={styles.editorTitle}>
                              {raw ? raw.name || raw.hex : optVal}
                            </div>
                            <div className={styles.editorSub}>
                              All <strong>{optKey}</strong> variants with this value
                            </div>
                          </div>
                        </div>
                        <ImageGrid
                          images={imgs}
                          onAdd={(f) => handleGroupAdd(optKey, optVal, f)}
                          onRemove={(i) => handleGroupRemove(optKey, optVal, i)}
                        />
                        {imgs.length === 0 && (
                          <p className={styles.emptyHint}>
                            No images — product images will be used as fallback.
                          </p>
                        )}
                      </>
                    );
                  })()
                ) : (
                  <div className={styles.editorPlaceholder}>
                    <span>← Select an option to add images</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── COMBO scope ─────────────────────────────────────────────────── */}
          {scope === "combo" && (
            <div className={styles.variantLayout}>
              {/* Left: variant list */}
              <div className={styles.variantList}>
                {variants.map((v) => {
                  const count = comboCount(v.id);
                  // find first colour option for dot
                  const colorKey = optionTypes.find(isColorKey);
                  const colorRaw = colorKey ? splitNameHex(v.options[colorKey] || "") : null;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      className={`${styles.variantItem} ${selectedKey === v.id ? styles.variantItemActive : ""}`}
                      onClick={() => setSelectedKey(v.id === selectedKey ? null : v.id)}>
                      <div className={styles.variantItemLeft}>
                        {colorRaw?.hex && (
                          <span className={styles.colorDot} style={{ background: colorRaw.hex }} />
                        )}
                        <div className={styles.variantItemVal}>{variantLabel(v, optionTypes)}</div>
                      </div>
                      <span
                        className={`${styles.countBadge} ${count > 0 ? styles.countBadgeActive : ""}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right: editor for selected combo */}
              <div className={styles.variantEditor}>
                {selectedKey ? (
                  (() => {
                    const v = variants.find((x) => x.id === selectedKey);
                    if (!v) return null;
                    const slot = getComboSlot(v.id);
                    const imgs = allImagesForSlot(slot);
                    const colorKey = optionTypes.find(isColorKey);
                    const colorRaw = colorKey ? splitNameHex(v.options[colorKey] || "") : null;
                    return (
                      <>
                        <div className={styles.editorHeader}>
                          {colorRaw?.hex && (
                            <span
                              className={styles.colorDotLg}
                              style={{ background: colorRaw.hex }}
                            />
                          )}
                          <div>
                            <div className={styles.editorTitle}>{variantLabel(v, optionTypes)}</div>
                            <div className={styles.editorSub}>
                              Overrides group images for this exact combination
                            </div>
                          </div>
                        </div>
                        <ImageGrid
                          images={imgs}
                          onAdd={(f) => handleComboAdd(v.id, f)}
                          onRemove={(i) => handleComboRemove(v.id, i)}
                        />
                        {imgs.length === 0 && (
                          <p className={styles.emptyHint}>
                            No images — group or product images will be used as fallback.
                          </p>
                        )}
                      </>
                    );
                  })()
                ) : (
                  <div className={styles.editorPlaceholder}>
                    <span>← Select a combination to add images</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
