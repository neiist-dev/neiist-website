"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import {
  FaArrowLeft,
  FaPlus,
  FaSave,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
  FaUpload,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { LuCheck } from "react-icons/lu";
import { Product, Category } from "@/types/shop";
import styles from "@/styles/components/shop/ProductForm.module.css";
import { splitNameHex, isColorKey, joinNameHex } from "@/utils/shopUtils";
import TagInput, { TagValue } from "@/components/TagInput";
import ColorfulText from "../ColorfulText";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProductFormProps {
  product?: Product | null;
  isEdit?: boolean;
  onBack: () => void;
  categories: Category[];
}

type VariantDefinition = { id: string; name: string; values: TagValue[] };
type ImageFile = { file: File; preview: string };

// Level 2 — a specific combination (e.g. Red • S)
type VariantForm = {
  id?: number;
  options: { [k: string]: string };
  price_modifier: number;
  stock_quantity: number;
  active: boolean;
  existingImages: string[];
  newImages: ImageFile[];
};

// Level 1 — a single option value (e.g. Red, or S)
// key = "OptionType::OptionValue"
type GroupSlot = {
  existing: string[];
  newFiles: ImageFile[];
  price_modifier: number;
  stock_quantity: number; // 0 = no cap
};
type GroupImages = Record<string, GroupSlot>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slotImgs(slot: GroupSlot) {
  return [...slot.existing, ...slot.newFiles.map((f) => f.preview)];
}

function displayName(optType: string, raw: string) {
  if (isColorKey(optType)) return splitNameHex(raw).name || raw;
  return raw;
}

// ─── ImageGrid ───────────────────────────────────────────────────────────────

function ImageGrid({
  images,
  onAdd,
  onRemove,
}: {
  images: string[];
  onAdd: (_file: File) => void;
  onRemove: (_i: number) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className={styles.variantImageGrid}>
      {images.map((src, i) => (
        <div key={i} className={styles.variantImgSlot}>
          <Image src={src} alt="" fill className={styles.variantImgThumb} />
          <button type="button" className={styles.variantImgRemove} onClick={() => onRemove(i)}>
            <FaTrash size={8} />
          </button>
        </div>
      ))}
      <button type="button" className={styles.variantImgAdd} onClick={() => ref.current?.click()}>
        <FaPlus size={12} />
        <input
          ref={ref}
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

// ─── ImageCarousel ───────────────────────────────────────────────────────────

function ImageCarousel({
  images,
  onAdd,
  onRemove,
}: {
  images: string[];
  onAdd: (_file: File) => void;
  onRemove: (_i: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLInputElement>(null);
  const safe = Math.min(idx, Math.max(0, images.length - 1));

  return (
    <div className={styles.carousel}>
      <div className={styles.carouselStage}>
        {images.length > 0 ? (
          <>
            <Image key={safe} src={images[safe]} alt="" fill className={styles.carouselImg} />
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
                      className={`${styles.dot} ${i === safe ? styles.dotActive : ""}`}
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
                onRemove(safe);
                setIdx(Math.max(0, safe - 1));
              }}>
              <FaTrash size={11} /> Remover
            </button>
          </>
        ) : (
          <div className={styles.carouselEmpty}>
            <FaUpload size={22} style={{ opacity: 0.3 }} />
            <span>Sem imagens</span>
          </div>
        )}
      </div>
      <div className={styles.thumbStrip}>
        {images.map((src, i) => (
          <button
            key={i}
            type="button"
            className={`${styles.thumbBtn} ${i === safe ? styles.thumbBtnActive : ""}`}
            onClick={() => setIdx(i)}>
            <Image src={src} alt="" fill className={styles.thumbImg} />
          </button>
        ))}
        <button type="button" className={styles.thumbAdd} onClick={() => ref.current?.click()}>
          <FaUpload size={12} />
          <input
            ref={ref}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                onAdd(f);
                setIdx(images.length);
              }
              e.target.value = "";
            }}
          />
        </button>
      </div>
    </div>
  );
}

// ─── VmCard — shared expandable card ─────────────────────────────────────────

function VmCard({
  isOpen,
  isInactive,
  onToggle,
  left,
  right,
  children,
}: {
  isOpen: boolean;
  isInactive?: boolean;
  onToggle: () => void;
  left: React.ReactNode;
  right?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={[
        styles.vmCard,
        isOpen && styles.vmCardExpanded,
        isInactive && styles.vmCardInactive,
      ]
        .filter(Boolean)
        .join(" ")}>
      <div className={styles.vmHeader} onClick={onToggle}>
        <div className={styles.vmHeaderLeft}>{left}</div>
        <div className={styles.vmHeaderRight}>
          {right}
          <span className={styles.expandIcon}>
            {isOpen ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
          </span>
        </div>
      </div>
      {isOpen && <div className={styles.vmBody}>{children}</div>}
    </div>
  );
}

// ─── PriceStockFields — shared inline fields ──────────────────────────────────

function PriceStockFields({
  price,
  stock,
  onPrice,
  onStock,
  disabled,
  stockWarning,
  isOnDemand,
}: {
  price: number;
  stock: number;
  onPrice: (_v: number) => void;
  onStock: (_v: number) => void;
  disabled?: boolean;
  stockWarning?: string;
  basePrice?: number;
  isOnDemand?: boolean;
}) {
  const stockDisabled = disabled || isOnDemand;
  const priceLabel = "Preço +/-";

  return (
    <div className={styles.vmFields}>
      <div className={styles.vmFieldGroup}>
        <span className={styles.subLabel}>{priceLabel}</span>
        <div className={styles.row} style={{ gap: "0.35rem" }}>
          <input
            className={styles.field}
            type="number"
            value={price}
            onChange={(e) => onPrice(Number(e.target.value))}
            placeholder="0.00"
            step="0.01"
            disabled={disabled}
          />
          <span style={{ color: "#9ca3af", fontSize: "0.9rem" }}>€</span>
        </div>
      </div>
      <div className={styles.vmFieldGroup}>
        <span className={styles.subLabel}>
          Stock {stock === 0 ? <span className={styles.capHint}>(bloqueado)</span> : ""}
          {isOnDemand && <span className={styles.capHint}> (sob encomenda)</span>}
        </span>
        <input
          className={[styles.field, stockWarning ? styles.fieldWarn : ""].join(" ")}
          type="number"
          value={stock}
          onChange={(e) => onStock(Number(e.target.value))}
          placeholder="0 = sem limite"
          disabled={stockDisabled}
          min={0}
        />
        {stockWarning && <span className={styles.warnText}>{stockWarning}</span>}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ProductForm({
  product,
  isEdit = false,
  onBack,
  categories,
}: ProductFormProps) {
  // ── Core fields ──────────────────────────────────────────────────────────
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price || 0);
  const [category, setCategory] = useState(product?.category || "");
  const [stockType, setStockType] = useState(product?.stock_type || "limited");
  const [stockQuantity, setStockQuantity] = useState(product?.stock_quantity || 0);
  const [orderDeadline, setOrderDeadline] = useState<Date | undefined>(
    product?.order_deadline ? new Date(product.order_deadline) : undefined
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const deadlineRef = useRef<HTMLInputElement>(null);
  const [allCategories] = useState<Category[]>(categories);

  // ── Product images ───────────────────────────────────────────────────────
  const [existingProductImages, setExistingProductImages] = useState<string[]>(
    product?.images || []
  );
  const [newProductImages, setNewProductImages] = useState<ImageFile[]>([]);
  const allProductImages = [...existingProductImages, ...newProductImages.map((f) => f.preview)];

  // ── Variant definitions ──────────────────────────────────────────────────
  const [variantDefinitions, setVariantDefinitions] = useState<VariantDefinition[]>(() => {
    if (product?.variants?.length) {
      const types = [...new Set(product.variants.flatMap((v) => Object.keys(v.options || {})))];
      return types.map((type) => {
        const rawValues = [
          ...new Set(
            product.variants
              ?.map((v) => v.options[type])
              .filter((v): v is string => typeof v === "string")
          ),
        ];

        // If it's a color, convert "Name - #HEX" strings to objects
        let values: TagValue[] = rawValues;
        if (isColorKey(type)) {
          values = rawValues.map((val) => {
            const { name, hex } = splitNameHex(val);
            return hex ? { name: name || val, color: hex } : val;
          });
        }

        return {
          id: Math.random().toString(36).substr(2, 9),
          name: type,
          values,
        };
      });
    }
    return [{ id: "1", name: "", values: [] }];
  });
  const optionTypes = variantDefinitions.map((d) => d.name).filter(Boolean);

  // ── Level 2 — variant combos ─────────────────────────────────────────────
  const [variants, setVariants] = useState<VariantForm[]>(
    product?.variants?.map((v) => ({
      id: v.id,
      options: Object.fromEntries(
        Object.entries(v.options || {}).map(([k, val]) => [
          k,
          typeof val === "string" ? val.replace(/^["']|["']$/g, "") : val,
        ])
      ),
      price_modifier: v.price_modifier || 0,
      stock_quantity: v.stock_quantity || 0,
      active: v.active !== false,
      existingImages: v.images || [],
      newImages: [],
    })) || []
  );

  // ── Level 1 — group slots ────────────────────────────────────────────────
  const [groupImages, setGroupImages] = useState<GroupImages>(() => {
    if (!product?.variants?.length) return {};
    const initial: GroupImages = {};
    for (const v of product.variants) {
      for (const [optType, optVal] of Object.entries(v.options || {})) {
        const val =
          typeof optVal === "string" ? optVal.replace(/^["']|["']$/g, "") : String(optVal);
        const key = `${optType}::${val}`;
        if (!initial[key]) {
          initial[key] = { existing: [], newFiles: [], price_modifier: 0, stock_quantity: 0 };
        }
      }
    }
    return initial;
  });

  // ── Tab state: which option type is active for L1, and "combos" for L2 ──
  // Tab values: an optionType name (L1) or "__combos__" (L2)
  const [activeTab, setActiveTab] = useState<string>("__combos__");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // ── Auto-generate L2 combinations ────────────────────────────────────────
  useEffect(() => {
    const hasAny = variantDefinitions.some((d) => d.values.length > 0);
    if (!hasAny && variants.length > 0) setVariants([]);
  }, [variantDefinitions, variants.length]);

  const generateVariants = useCallback((defs: VariantDefinition[]) => {
    const valid = defs.filter((d) => d.name && d.values.length > 0);
    if (!valid.length) return;
    const cartesian = (sets: TagValue[][]) =>
      sets.reduce<TagValue[][]>((acc, set) => acc.flatMap((x) => set.map((y) => [...x, y])), [[]]);
    const names = valid.map((d) => d.name);
    const combos = cartesian(valid.map((d) => d.values));
    setVariants((prev) =>
      combos.map((combo) => {
        const options = Object.fromEntries(names.map((n, i) => {
          const val = combo[i];
          // Convert objects back to string to save in options
          const strVal = typeof val === "string" ? val : joinNameHex(val.name, val.color);
          return [n, strVal];
        }));

        const existing = prev.find((v) =>
          names.every((n) => {
            const ev = v.options[n] || "",
              nv = options[n];
            if (isColorKey(n)) {
              const { hex: eh } = splitNameHex(ev);
              const { hex: nh } = splitNameHex(nv);
              if (eh && nh && eh === nh) return true;
            }
            return ev === nv;
          })
        );
        return (
          existing ?? {
            options,
            price_modifier: 0,
            stock_quantity: 0,
            active: true,
            existingImages: [],
            newImages: [],
          }
        );
      })
    );
  }, []);

  useEffect(() => {
    const t = setTimeout(() => generateVariants(variantDefinitions), 500);
    return () => clearTimeout(t);
  }, [variantDefinitions, generateVariants]);

  const totalVariantStock = variants.reduce(
    (sum, v) => sum + (v.active ? Number(v.stock_quantity) || 0 : 0),
    0
  );
  const hasVariants = variants.length > 0;
  const hasGroupKeys = variantDefinitions.some((d) => d.name && d.values.length > 0);

  // Reset active tab if it no longer exists
  useEffect(() => {
    const validTabs = [
      ...(hasGroupKeys ? ["__groups__"] : []),
      ...(hasVariants ? ["__combos__"] : []),
    ];
    if (!validTabs.includes(activeTab) && validTabs.length > 0) {
      setActiveTab(validTabs[0]);
    }
  }, [optionTypes, hasVariants, hasGroupKeys, activeTab]);

  // ── Variant helpers ───────────────────────────────────────────────────────
  const updateVariant = (i: number, u: Partial<VariantForm>) =>
    setVariants((p) => p.map((v, idx) => (idx === i ? { ...v, ...u } : v)));

  const addVariantImage = (i: number, file: File) =>
    updateVariant(i, {
      newImages: [...variants[i].newImages, { file, preview: URL.createObjectURL(file) }],
    });

  const removeVariantImage = (vi: number, ii: number) => {
    const v = variants[vi];
    if (ii < v.existingImages.length) {
      updateVariant(vi, { existingImages: v.existingImages.filter((_, i) => i !== ii) });
    } else {
      const ni = ii - v.existingImages.length;
      URL.revokeObjectURL(v.newImages[ni].preview);
      updateVariant(vi, { newImages: v.newImages.filter((_, i) => i !== ni) });
    }
  };

  // ── Group helpers ─────────────────────────────────────────────────────────
  const getSlot = (key: string): GroupSlot =>
    groupImages[key] ?? { existing: [], newFiles: [], price_modifier: 0, stock_quantity: 0 };

  const setSlot = (key: string, slot: GroupSlot) => setGroupImages((p) => ({ ...p, [key]: slot }));

  const addGroupImage = (key: string, file: File) => {
    const s = getSlot(key);
    setSlot(key, { ...s, newFiles: [...s.newFiles, { file, preview: URL.createObjectURL(file) }] });
  };

  const removeGroupImage = (key: string, idx: number) => {
    const s = getSlot(key);
    if (idx < s.existing.length) {
      setSlot(key, { ...s, existing: s.existing.filter((_, i) => i !== idx) });
    } else {
      const ni = idx - s.existing.length;
      URL.revokeObjectURL(s.newFiles[ni].preview);
      setSlot(key, { ...s, newFiles: s.newFiles.filter((_, i) => i !== ni) });
    }
  };

  // ── Definition helpers ────────────────────────────────────────────────────
  const addDef = () =>
    setVariantDefinitions((p) => [
      ...p,
      { id: Math.random().toString(36).substr(2, 9), name: "", values: [] },
    ]);

  const updateDefName = (i: number, newName: string) => {
    const old = variantDefinitions[i].name;
    setVariantDefinitions((p) => p.map((d, idx) => (idx === i ? { ...d, name: newName } : d)));
    setVariants((p) =>
      p.map((v) => {
        const opts = { ...v.options };
        if (old in opts && newName !== old) {
          opts[newName] = opts[old];
          delete opts[old];
        }
        return { ...v, options: opts };
      })
    );
  };

  const updateDefValues = (i: number, values: TagValue[]) =>
    setVariantDefinitions((p) => p.map((d, idx) => (idx === i ? { ...d, values } : d)));

  const removeDef = (i: number) => {
    const removed = variantDefinitions[i].name;
    setVariantDefinitions((p) => p.filter((_, idx) => idx !== i));
    setVariants((p) =>
      p.map((v) => ({
        ...v,
        options: Object.fromEntries(Object.entries(v.options).filter(([k]) => k !== removed)),
      }))
    );
  };

  // ── Stock cap validation ──────────────────────────────────────────────────
  function stockWarningFor(variant: VariantForm): string | undefined {
    for (const optType of optionTypes) {
      const val = variant.options[optType] || "";
      const key = `${optType}::${val}`;
      const groupSlot = groupImages[key];
      if (!groupSlot) continue;
      const cap = groupSlot.stock_quantity;

      // 0 = hard zero (blocked)
      if (cap === 0 && variant.stock_quantity > 0) {
        return `Group "${displayName(optType, val)}" has stock 0 — this combination is blocked`;
      }

      if (cap > 0) {
        const siblingTotal = variants
          .filter((v) => v.active && v !== variant && v.options[optType] === val)
          .reduce((sum, v) => sum + (Number(v.stock_quantity) || 0), 0);

        const totalIfSaved = siblingTotal + (Number(variant.stock_quantity) || 0);

        if (totalIfSaved > cap) {
          return `Sum of variants for "${displayName(optType, val)}" (${totalIfSaved}) exceeds group stock (max. ${cap})`;
        }
      }
    }
    return undefined;
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Nome é obrigatório");
      return;
    }
    if (!category) {
      setError("Categoria é obrigatória");
      return;
    }
    for (const v of variants) {
      for (const t of optionTypes) {
        if (!(v.options[t] || "").trim()) {
          setError(`Variante deve ter "${t}" preenchido`);
          return;
        }
        if (isColorKey(t) && !splitNameHex(v.options[t] || "").hex) {
          setError(`Cor "${t}" precisa de hex`);
          return;
        }
      }
      const warn = stockWarningFor(v);
      if (warn) {
        setError(warn);
        return;
      }
    }
    setUploading(true);
    try {
      const toB64 = (file: File) =>
        new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res((r.result as string).split(",")[1]);
          r.onerror = rej;
          r.readAsDataURL(file);
        });
      const imageUploads = await Promise.all(
        newProductImages.map(async ({ file }) => ({
          imageBase64: await toB64(file),
          imageName: file.name,
        }))
      );
      const groupUploads: Record<
        string,
        {
          existing: string[];
          uploads: { imageBase64: string; imageName: string }[];
          price_modifier: number;
          stock_quantity: number;
        }
      > = {};
      for (const [key, slot] of Object.entries(groupImages)) {
        groupUploads[key] = {
          existing: slot.existing,
          price_modifier: slot.price_modifier,
          stock_quantity: slot.stock_quantity,
          uploads: await Promise.all(
            slot.newFiles.map(async ({ file }) => ({
              imageBase64: await toB64(file),
              imageName: file.name,
            }))
          ),
        };
      }
      const variantsOut = await Promise.all(
        variants.map(async (v) => ({
          id: v.id,
          options: v.options,
          price_modifier: v.price_modifier,
          stock_quantity: v.stock_quantity,
          active: v.active,
          images: v.existingImages,
          imageUploads: await Promise.all(
            v.newImages.map(async ({ file }) => ({
              imageBase64: await toB64(file),
              imageName: file.name,
            }))
          ),
        }))
      );
      const body = {
        id: product?.id,
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        category,
        stock_type: stockType,
        stock_quantity: Number(stockQuantity),
        images: existingProductImages,
        imageUploads,
        group_image_uploads: groupUploads,
        variants: variantsOut,
        order_deadline: orderDeadline?.toISOString() ?? null,
      };
      const res = await fetch(isEdit ? `/api/shop/products/${product?.id}` : "/api/shop/products", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        window.location.href = "/shop/manage";
      } else {
        const err = await res.json();
        setError("Erro: " + (err.message || err.error || "Erro desconhecido"));
      }
    } catch {
      setError("Erro ao guardar produto");
    } finally {
      setUploading(false);
    }
  };

  // Tab list: flat "Grupos" (all L1 values) + "Combinações" (L2)
  const tabs = [
    ...(hasGroupKeys ? [{ id: "__groups__", label: "Grupos" }] : []),
    ...(hasVariants ? [{ id: "__combos__", label: "Combinações" }] : []),
  ];

  // All L1 group entries flat across all option types
  const groupKeys: { key: string; optType: string; optVal: string; hex?: string; label: string }[] =
    [];
  for (const def of variantDefinitions) {
    if (!def.name || !def.values.length) continue;
    for (const val of def.values) {
      // Normalize to string and visualization data
      let strVal = "";
      let hex: string | undefined;
      let label = "";

      if (typeof val === "string") {
        const raw = isColorKey(def.name) ? splitNameHex(val) : null;
        strVal = val;
        hex = raw?.hex;
        label = raw ? raw.name || raw.hex : val;
      } else {
        strVal = joinNameHex(val.name, val.color);
        hex = val.color;
        label = val.name;
      }

      groupKeys.push({
        key: `${def.name}::${strVal}`,
        optType: def.name,
        optVal: strVal,
        hex,
        label,
      });
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className={styles.formHeader}>
          <button type="button" className={styles.backButton} onClick={onBack}>
            <FaArrowLeft /> Voltar
          </button>
          <ColorfulText
            className={styles.title}
            text={isEdit ? "Editar Produto" : "Adicionar Novo Produto"}
          />
          <button type="submit" className={styles.button} disabled={uploading}>
            {isEdit ? (
              <>
                <FaSave /> {uploading ? "A guardar..." : "Guardar Alterações"}
              </>
            ) : (
              <>
                <FaPlus /> {uploading ? "A guardar..." : "Criar Produto"}
              </>
            )}
          </button>
        </div>

        <div className={styles.formBody}>
          {/* ══ RIGHT — Product info + images ══ */}
          <div className={styles.section}>
            <div className={styles.card}>
              <label className={styles.label}>Informação Básica</label>
              <input
                className={styles.field}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do produto"
                required
              />
              <textarea
                className={styles.field}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição"
                rows={3}
              />
              <select
                className={styles.field}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required>
                <option value="">Escolha categoria</option>
                {allCategories.map((cat) => (
                  <option key={cat.id || cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className={styles.row}>
                <input
                  className={styles.field}
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  step="0.01"
                  min="0"
                  placeholder="Preço base"
                  required
                />
                <span>€</span>
              </div>
            </div>

            <div className={styles.card}>
              <label className={styles.label}>Stock</label>
              <div className={styles.row}>
                <select
                  className={styles.field}
                  value={stockType}
                  onChange={(e) => {
                    const v = e.target.value as "limited" | "on_demand";
                    setStockType(v);
                    if (v !== "limited" || variants.length !== 0) setStockQuantity(0);
                  }}
                  style={{ flex: 1 }}>
                  <option value="limited">Stock Limitado</option>
                  <option value="on_demand">Sob Encomenda</option>
                </select>
                <div style={{ flex: 1 }}>
                  {stockType === "limited" ? (
                    <input
                      className={styles.field}
                      type="number"
                      value={hasVariants ? totalVariantStock : stockQuantity}
                      onChange={(e) => setStockQuantity(Number(e.target.value))}
                      disabled={hasVariants}
                    />
                  ) : (
                    <>
                      <input
                        className={styles.field}
                        ref={deadlineRef}
                        type="text"
                        value={orderDeadline ? orderDeadline.toLocaleDateString("pt-PT") : ""}
                        placeholder="Data limite encomenda"
                        readOnly
                        onClick={() => setShowDatePicker(true)}
                      />
                      {showDatePicker && (
                        <div className={styles.datePickerPopup}>
                          <DayPicker
                            mode="single"
                            selected={orderDeadline}
                            onSelect={(d) => {
                              setOrderDeadline(d ?? undefined);
                              setShowDatePicker(false);
                            }}
                            weekStartsOn={1}
                            captionLayout="dropdown"
                            navLayout="around"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              {hasVariants && stockType === "limited" && (
                <p className={styles.hint}>Stock gerido pela soma das variantes.</p>
              )}
            </div>

            <div className={styles.card}>
              <label className={styles.label}>Imagens do Produto</label>
              <p className={styles.hint}>
                Galeria principal — usada quando a variante não tem imagens próprias.
              </p>
              <ImageCarousel
                images={allProductImages}
                onAdd={(file) => {
                  const preview = URL.createObjectURL(file);
                  setNewProductImages((prev) => [...prev, { file, preview }]);
                }}
                onRemove={(index) => {
                  if (index < existingProductImages.length) {
                    setExistingProductImages((prev) => prev.filter((_, i) => i !== index));
                  } else {
                    const ni = index - existingProductImages.length;
                    URL.revokeObjectURL(newProductImages[ni].preview);
                    setNewProductImages((prev) => prev.filter((_, i) => i !== ni));
                  }
                }}
              />
            </div>
          </div>

          {/* ══ LEFT — Variant Manager ══ */}
          <div className={styles.section}>
            {/* Definitions */}
            <div className={styles.card}>
              <label className={styles.label}>Definições de Variantes</label>
              <div className={styles.variantDefinitionsList}>
                {variantDefinitions.map((def, idx) => (
                  <div key={def.id} className={styles.row}>
                    <input
                      className={`${styles.field} ${styles.variantNameInput}`}
                      value={def.name}
                      onChange={(e) => updateDefName(idx, e.target.value)}
                      placeholder="Nome (ex: Tamanho)"
                    />
                    <div className={styles.variantValuesInput}>
                      <TagInput
                        value={def.values}
                        onChange={(tags) => updateDefValues(idx, tags)}
                        placeholder={
                          isColorKey(def.name)
                            ? "Nome da cor (ex: Azul)" : "Valores (ex: S, M, L)"
                        }
                        isColor={isColorKey(def.name)}
                      />
                    </div>
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => removeDef(idx)}>
                      <FaTrash />
                    </button>
                  </div>
                ))}
                <div className={styles.addDefButtonWrapper}>
                  <button type="button" className={styles.button} onClick={addDef}>
                    <FaPlus /> Adicionar Definição
                  </button>
                </div>
              </div>
            </div>

            {/* Tabbed level panel — only shown when there are definitions with values */}
            {tabs.length > 0 && (
              <div className={styles.card} style={{ flex: 1, minHeight: 0 }}>
                {/* Tab bar */}
                <div className={styles.tabBar}>
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ""}`}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setExpandedKey(null);
                      }}>
                      {tab.label}
                      {tab.id === "__groups__" &&
                        (() => {
                          const filled = groupKeys.filter(({ key }) => {
                            const s = groupImages[key];
                            return (
                              s &&
                              (s.price_modifier !== 0 ||
                                s.stock_quantity !== 0 ||
                                s.existing.length > 0 ||
                                s.newFiles.length > 0)
                            );
                          }).length;
                          return filled > 0 ? (
                            <span className={styles.tabBadge}>{filled}</span>
                          ) : null;
                        })()}
                      {tab.id === "__combos__" &&
                        (() => {
                          const active = variants.filter((v) => v.active).length;
                          return (
                            <span className={`${styles.tabBadge} ${styles.tabBadgeNeutral}`}>
                              {active}
                            </span>
                          );
                        })()}
                    </button>
                  ))}
                </div>

                {/* ── L1 tab — all option values flat ── */}
                {activeTab === "__groups__" && (
                  <div className={styles.vmList}>
                    {groupKeys.length === 0 && (
                      <p className={styles.noVarients}>
                        Adiciona valores às definições para configurar grupos.
                      </p>
                    )}
                    {groupKeys.map(({ key, optType, optVal, hex, label }) => {
                      const slot = getSlot(key);
                      const imgs = slotImgs(slot);
                      const isOpen = expandedKey === key;

                      return (
                        <VmCard
                          key={key}
                          isOpen={isOpen}
                          onToggle={() => setExpandedKey(isOpen ? null : key)}
                          left={
                            <>
                              {hex ? (
                                <span className={styles.vmSwatch} style={{ background: hex }} />
                              ) : (
                                <span className={styles.vmTypeTag}>{optType[0].toUpperCase()}</span>
                              )}
                              {imgs.length > 0 && (
                                <div className={styles.vmThumb}>
                                  <Image src={imgs[0]} alt="" fill className={styles.vmThumbImg} />
                                </div>
                              )}
                              <span className={styles.vmName}>{label}</span>
                              <span className={styles.vmOptType}>{optType}</span>
                            </>
                          }
                          right={
                            <>
                              {(() => {
                                const variantTotal = variants
                                  .filter((v) => v.active && v.options[optType] === optVal)
                                  .reduce((sum, v) => sum + (Number(v.stock_quantity) || 0), 0);

                                return slot.price_modifier !== 0 || variantTotal !== 0 ? (
                                  <span className={styles.vmMetaBadge}>
                                    {slot.price_modifier !== 0 && (
                                      <span>{(price + slot.price_modifier).toFixed(2)}€</span>
                                    )}
                                    {variantTotal !== 0 && <span>{variantTotal}un</span>}
                                  </span>
                                ) : null;
                              })()}
                              {imgs.length > 0 && (
                                <span className={`${styles.imgBadge} ${styles.imgBadgeActive}`}>
                                  {imgs.length}
                                </span>
                              )}
                            </>
                          }>
                          <PriceStockFields
                            price={slot.price_modifier}
                            stock={slot.stock_quantity}
                            onPrice={(v) => setSlot(key, { ...slot, price_modifier: v })}
                            onStock={(v) => setSlot(key, { ...slot, stock_quantity: v })}
                            isOnDemand={stockType === "on_demand"}
                          />
                          <div>
                            <span
                              className={styles.subLabel}
                              style={{ display: "block", marginBottom: "0.5rem" }}>
                              Imagens
                            </span>
                            <ImageGrid
                              images={imgs}
                              onAdd={(f) => addGroupImage(key, f)}
                              onRemove={(i) => removeGroupImage(key, i)}
                            />
                            {imgs.length === 0 && (
                              <p className={styles.hint} style={{ marginTop: "0.4rem" }}>
                                Sem imagens — serão usadas as imagens do produto.
                              </p>
                            )}
                          </div>
                        </VmCard>
                      );
                    })}
                  </div>
                )}

                {/* ── L2 tab content — combinations ── */}
                {activeTab === "__combos__" && (
                  <div className={styles.vmList}>
                    {variants.length === 0 && (
                      <p className={styles.noVarients}>
                        Preencha as definições para gerar combinações.
                      </p>
                    )}
                    {variants.map((variant, i) => {
                      const vid = variant.id !== undefined ? String(variant.id) : `new-${i}`;
                      const isOpen = expandedKey === vid;
                      const allImgs = [
                        ...variant.existingImages,
                        ...variant.newImages.map((f) => f.preview),
                      ];
                      const colorKey = optionTypes.find(isColorKey);
                      const colorRaw = colorKey
                        ? splitNameHex(variant.options[colorKey] || "")
                        : null;
                      const label = optionTypes
                        .map((t) => displayName(t, variant.options[t] || ""))
                        .filter(Boolean)
                        .join(" • ");
                      const warn = stockWarningFor(variant);

                      return (
                        <VmCard
                          key={vid}
                          isOpen={isOpen}
                          isInactive={!variant.active}
                          onToggle={() => setExpandedKey(isOpen ? null : vid)}
                          left={
                            <>
                              <div
                                className={`${styles.checkboxCustom} ${variant.active ? styles.checkboxActive : ""}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateVariant(i, { active: !variant.active });
                                }}>
                                {variant.active && <LuCheck size={13} strokeWidth={3} />}
                              </div>
                              {colorRaw?.hex && (
                                <span
                                  className={styles.vmSwatch}
                                  style={{ background: colorRaw.hex }}
                                />
                              )}
                              {allImgs.length > 0 && (
                                <div className={styles.vmThumb}>
                                  <Image
                                    src={allImgs[0]}
                                    alt=""
                                    fill
                                    className={styles.vmThumbImg}
                                  />
                                </div>
                              )}
                              <span className={styles.vmName}>{label}</span>
                              {warn && <span className={styles.warnDot} title={warn} />}
                            </>
                          }
                          right={
                            <>
                              {(variant.price_modifier !== 0 || variant.stock_quantity !== 0) && (
                                <span className={styles.vmMetaBadge}>
                                  {variant.price_modifier !== 0 && (
                                    <span>{(price + variant.price_modifier).toFixed(2)}€</span>
                                  )}
                                  {variant.stock_quantity !== 0 && (
                                    <span>{variant.stock_quantity}un</span>
                                  )}
                                </span>
                              )}
                              {allImgs.length > 0 && (
                                <span className={`${styles.imgBadge} ${styles.imgBadgeActive}`}>
                                  {allImgs.length}
                                </span>
                              )}
                            </>
                          }>
                          <PriceStockFields
                            price={variant.price_modifier}
                            stock={variant.stock_quantity}
                            onPrice={(v) => updateVariant(i, { price_modifier: v })}
                            onStock={(v) => updateVariant(i, { stock_quantity: v })}
                            disabled={!variant.active}
                            stockWarning={warn}
                            isOnDemand={stockType === "on_demand"}
                          />
                          <div>
                            <span
                              className={styles.subLabel}
                              style={{ display: "block", marginBottom: "0.5rem" }}>
                              Imagens{" "}
                              <span style={{ fontWeight: 400, color: "#9ca3af" }}>
                                (substituem as imagens do produto)
                              </span>
                            </span>
                            <ImageGrid
                              images={allImgs}
                              onAdd={(f) => addVariantImage(i, f)}
                              onRemove={(ii) => removeVariantImage(i, ii)}
                            />
                            {allImgs.length === 0 && (
                              <p className={styles.hint} style={{ marginTop: "0.4rem" }}>
                                Sem imagens — serão usadas as imagens do produto.
                              </p>
                            )}
                          </div>
                        </VmCard>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {error && <div className={styles.error}>{error}</div>}
        </div>
      </form>
    </div>
  );
}
