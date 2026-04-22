"use client";
import { useState, useRef, useEffect, useMemo, type ReactNode } from "react";
import Image from "next/image";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import {
  FaArrowLeft,
  FaChevronDown,
  FaPlus,
  FaSave,
  FaTrash,
  FaTag,
  FaAlignLeft,
  FaFolder,
  FaEuroSign,
  FaBox,
  FaImages,
  FaSlidersH,
  FaLayerGroup,
  FaCalendarAlt,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Product, ProductVariant } from "@/types/shop/product";
import { Category } from "@/types/shop/category";
import styles from "@/styles/components/shop/ProductForm.module.css";
import { splitNameHex, isColorKey, joinNameHex } from "@/utils/shop/shopUtils";
import VariantOptionsEditor, { variantValue } from "@/components/shop/VariantOptionsEditor";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";
import ColorfulText from "@/components/ColorfulText";
import ToggleSwitch from "@/components/ToggleSwitch";

type ImageFile = { file: File; preview: string };
type VariantDefinition = { id: string; name: string; values: variantValue[] };
type GroupSlot = { existing: string[]; newFiles: ImageFile[]; price_modifier: number };
type GroupImages = Record<string, GroupSlot>;
type VariantForm = {
  id?: number;
  options: Record<string, string>;
  price_modifier: number;
  stock_quantity: number;
  active: boolean;
  existingImages: string[];
  newImages: ImageFile[];
};

type ProductFormProps = {
  product?: Product;
  isEdit?: boolean;
  onBackAction?: () => void;
  backHref?: string;
  categories: Category[];
};

const MAX_VARIANTS = 3;

const emptyGroupSlot = (): GroupSlot => ({ existing: [], newFiles: [], price_modifier: 0 });

const slotImages = (slot: GroupSlot) => [...slot.existing, ...slot.newFiles.map((f) => f.preview)];

const normalizeOptVal = (type: string, raw: string) => {
  if (!isColorKey(type)) return raw;
  const { name, hex } = splitNameHex(raw);
  return hex ? joinNameHex(name, hex) : raw;
};

const optValMatches = (type: string, varVal: string, grpVal: string) =>
  isColorKey(type) ? splitNameHex(varVal).hex === splitNameHex(grpVal).hex : varVal === grpVal;

const toBase64 = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res((reader.result as string).split(",")[1]);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });

const toImageUpload = async (file: File) => ({
  imageBase64: await toBase64(file),
  imageName: file.name,
});

const cartesian = <T,>(sets: T[][]): T[][] =>
  sets.reduce<T[][]>((acc, set) => acc.flatMap((x) => set.map((y) => [...x, y])), [[]]);

function ImageGrid({
  images,
  onAdd,
  onRemove,
  hint,
}: {
  images: string[];
  onAdd: (..._args: [file: File]) => void;
  onRemove: (..._args: [index: number]) => void;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className={styles.imgEditor}>
      {hint && <span className={styles.subLabel}>{hint}</span>}
      <div className={styles.imgGrid}>
        {images.map((src, i) => (
          <div key={i} className={styles.imgSlot}>
            <Image src={src} alt="" fill className={styles.imgThumb} />
            <button type="button" className={styles.imgRemove} onClick={() => onRemove(i)}>
              <FaTrash size={10} />
            </button>
          </div>
        ))}
        <button type="button" className={styles.imgAdd} onClick={() => inputRef.current?.click()}>
          <FaPlus size={14} />
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              Array.from(e.target.files ?? []).forEach(onAdd);
              e.target.value = "";
            }}
          />
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  iconAlignTop,
  children,
}: {
  label: string;
  icon: ReactNode;
  iconAlignTop?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={styles.fieldWrap}>
      <label className={`${styles.label} ${styles.basicLabel}`}>{label}</label>
      <div className={styles.inputRow}>
        <span className={`${styles.inputIcon} ${iconAlignTop ? styles.alignTopIcon : ""}`}>
          {icon}
        </span>
        <div className={styles.inputControl}>{children}</div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className={styles.sectionTitle}>
      <span className={styles.sectionTitleIcon}>{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function ItemCard({
  isOpen,
  onToggle,
  isActive = true,
  onActiveToggle,
  title,
  subtitle,
  hex,
  typeTag,
  meta,
  badge,
  children,
}: {
  isOpen: boolean;
  onToggle: () => void;
  isActive?: boolean;
  onActiveToggle?: () => void;
  title: string;
  subtitle?: string | null;
  hex?: string;
  typeTag?: string | null;
  meta?: string | null;
  badge: number;
  children: ReactNode;
}) {
  return (
    <div className={`${styles.itemCard} ${!isActive ? styles.itemCardInactive : ""}`}>
      <div className={styles.itemHeader} onClick={onToggle}>
        <div className={styles.itemHeaderLeft}>
          {onActiveToggle && (
            <input
              type="checkbox"
              checked={isActive}
              className={styles.checkbox}
              onClick={(e) => e.stopPropagation()}
              onChange={onActiveToggle}
            />
          )}
          {hex ? (
            <span className={styles.swatch} style={{ background: hex }} />
          ) : typeTag ? (
            <span className={styles.typeTag}>{typeTag}</span>
          ) : null}
          <span className={styles.itemTitle}>{title}</span>
          {subtitle && <span className={styles.itemSubtitle}>{subtitle}</span>}
        </div>
        <div className={styles.itemHeaderRight}>
          {meta && <span className={styles.itemMeta}>{meta}</span>}
          {badge > 0 && <span className={styles.badge}>{badge}</span>}
          <FaChevronDown className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`} />
        </div>
      </div>
      <div className={`${styles.itemBody} ${!isOpen ? styles.itemBodyClosed : ""}`}>{children}</div>
    </div>
  );
}

export default function ProductForm({
  product,
  isEdit = false,
  onBackAction,
  backHref = "/shop/manage",
  categories,
}: ProductFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product?.price ?? 0,
    category: product?.category ?? "",
    stock_type: product?.stock_type ?? "limited",
    stock_quantity: product?.stock_quantity ?? 0,
    order_deadline: product?.order_deadline ? new Date(product.order_deadline) : undefined,
  });
  const updateForm = (updates: Partial<typeof form>) => setForm((p) => ({ ...p, ...updates }));

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [allCategories, setAllCategories] = useState<Category[]>(categories);
  const [uploading, setUploading] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const initialVariantIdsRef = useRef<Set<number>>(
    new Set(product?.variants?.map((v) => v.id) ?? [])
  );

  const [productImages, setProductImages] = useState<{ existing: string[]; new: ImageFile[] }>({
    existing: product?.images ?? [],
    new: [],
  });

  const [variantDefinitions, setVariantDefinitions] = useState<VariantDefinition[]>(() => {
    if (!product?.variants?.length) return [{ id: "1", name: "", values: [] }];
    const types = [
      ...new Set(product.variants.flatMap((v: ProductVariant) => Object.keys(v.options ?? {}))),
    ];
    return types.map((type: string): VariantDefinition => {
      const rawValues = [
        ...new Set(product.variants!.map((v: ProductVariant) => String(v.options?.[type] ?? ""))),
      ];
      const values: variantValue[] = isColorKey(type)
        ? rawValues.map((val) => {
            const { name, hex } = splitNameHex(val);
            return hex ? { name: name || val, color: hex } : val;
          })
        : rawValues;
      return { id: Math.random().toString(36).slice(2), name: type, values };
    });
  });

  const [variants, setVariants] = useState<VariantForm[]>(
    product?.variants?.map((v: ProductVariant) => ({
      id: v.id,
      options: Object.fromEntries(
        Object.entries(v.options ?? {}).map(([k, val]) => [
          k,
          normalizeOptVal(k, String(val).replace(/['"]/g, "")),
        ])
      ),
      price_modifier: v.price_modifier ?? 0,
      stock_quantity: v.stock_quantity ?? 0,
      active: v.active !== false,
      existingImages: v.images ?? [],
      newImages: [],
    })) ?? []
  );

  const [groupImages, setGroupImages] = useState<GroupImages>(() => {
    if (!product?.variants?.length) return {};
    const initial: GroupImages = {};
    product.variants.forEach((v: ProductVariant) =>
      Object.entries(v.options ?? {}).forEach(([t, val]) => {
        const key = `${t}::${normalizeOptVal(t, String(val).replace(/['"]/g, ""))}`;
        if (!initial[key]) initial[key] = emptyGroupSlot();
      })
    );
    Object.entries(initial).forEach(([key, slot]) => {
      const [optType, optVal] = key.split("::");
      const seen = new Set<string>();
      product
        .variants!.filter(
          (v: ProductVariant) =>
            normalizeOptVal(optType, String(v.options?.[optType] ?? "")) === optVal
        )
        .forEach((v: ProductVariant) =>
          v.images?.forEach((img: string) => {
            if (!seen.has(img)) {
              seen.add(img);
              slot.existing.push(img);
            }
          })
        );
    });
    return initial;
  });

  const [activeTab, setActiveTab] = useState<"__groups__" | "__combos__">("__groups__");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [showSecondaryGroups, setShowSecondaryGroups] = useState(false);

  const categoryOptions = useMemo(() => allCategories.map((c) => c.name).sort(), [allCategories]);
  const optionTypes = variantDefinitions.map((d) => d.name).filter(Boolean);
  const hasVariants = variants.length > 0;
  const totalVariantStock = variants.reduce(
    (acc, v) => acc + (v.active ? Number(v.stock_quantity) : 0),
    0
  );
  const allGlobalImages = [...productImages.existing, ...productImages.new.map((f) => f.preview)];
  const hasAnyVariantSpecificImage =
    variants.some((v) => v.existingImages.length > 0 || v.newImages.length > 0) ||
    Object.values(groupImages).some((s) => s.existing.length > 0 || s.newFiles.length > 0);

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
    const handler = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node))
        setShowDatePicker(false);
    };
    if (showDatePicker) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDatePicker]);

  // Auto-generate variant combinations from definitions
  useEffect(() => {
    const timer = setTimeout(() => {
      const valid = variantDefinitions.filter((d) => d.name && d.values.length > 0);
      if (!valid.length) {
        setVariants([]);
        setGroupImages({});
        return;
      }

      const names = valid.map((d) => d.name);
      setVariants((prev) =>
        cartesian(valid.map((d) => d.values)).map((combo) => {
          const opts = Object.fromEntries(
            names.map((n, i) => {
              const val = combo[i];
              return [n, typeof val === "string" ? val : joinNameHex(val.name, val.color)];
            })
          );
          return (
            prev.find((v) => names.every((n) => optValMatches(n, v.options[n] ?? "", opts[n]))) ?? {
              options: opts,
              price_modifier: 0,
              stock_quantity: 0,
              active: true,
              existingImages: [],
              newImages: [],
            }
          );
        })
      );
    }, 500);
    return () => clearTimeout(timer);
  }, [variantDefinitions]);

  useEffect(() => {
    const validTabs: Array<"__groups__" | "__combos__"> = [
      ...(groupKeys.length ? ["__groups__" as const] : []),
      ...(hasVariants ? ["__combos__" as const] : []),
    ];
    if (validTabs.length && !validTabs.includes(activeTab)) setActiveTab(validTabs[0]);
  }, [groupKeys.length, hasVariants, activeTab]);

  const handleCategoryCreate = async (name: string) => {
    try {
      const res = await fetch("/api/shop/categories", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.category?.name) {
        setAllCategories((p) => [...p, data.category]);
        updateForm({ category: data.category.name });
      }
    } catch {
      toast.error("Erro ao criar categoria.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category)
      return toast.error("Nome e Categoria são obrigatórios.");
    setUploading(true);
    try {
      const currentVariantIds = new Set(
        variants.map((v) => v.id).filter((id): id is number => typeof id === "number")
      );
      const variantsToDelete = Array.from(initialVariantIdsRef.current).filter(
        (id) => !currentVariantIds.has(id)
      );

      const payload = {
        id: product?.id,
        ...form,
        images: productImages.existing,
        imageUploads: await Promise.all(productImages.new.map((f) => toImageUpload(f.file))),
        group_image_uploads: Object.fromEntries(
          await Promise.all(
            Object.entries(groupImages).map(async ([k, v]) => [
              k,
              {
                existing: v.existing,
                price_modifier: v.price_modifier,
                uploads: await Promise.all(v.newFiles.map((f) => toImageUpload(f.file))),
              },
            ])
          )
        ),
        variants: await Promise.all(
          variants.map(async (v) => ({
            id: v.id,
            options: v.options,
            price_modifier: v.price_modifier,
            stock_quantity: v.stock_quantity,
            active: v.active,
            images: v.existingImages,
            imageUploads: await Promise.all(v.newImages.map((f) => toImageUpload(f.file))),
          }))
        ),
        variantsToDelete,
        order_deadline: form.order_deadline?.toISOString() ?? null,
      };

      const res = await fetch(isEdit ? `/api/shop/products/${product?.id}` : "/api/shop/products", {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      if (res.ok) router.replace(backHref);
      else throw new Error((await res.json()).error);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao guardar.");
    } finally {
      setUploading(false);
    }
  };

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
        : { ...slot, newFiles: slot.newFiles.filter((_, idx) => idx !== i - slot.existing.length) },
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

  const showGlobalImages =
    !hasVariants || allGlobalImages.length > 0 || !hasAnyVariantSpecificImage;

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onBackAction ?? (() => router.push(backHref))}>
            <FaArrowLeft /> Voltar
          </button>
          <ColorfulText
            className={styles.title}
            text={isEdit ? "Editar Produto" : "Novo Produto"}
          />
          <button type="submit" className={styles.btnPrimary} disabled={uploading}>
            {isEdit ? <FaSave /> : <FaPlus />}
            {uploading ? "A guardar..." : isEdit ? "Guardar Alterações" : "Criar Produto"}
          </button>
        </div>

        <div className={styles.grid}>
          <div className={styles.sectionCol}>
            <div className={styles.stackBlock}>
              <Field label="Nome do Produto" icon={<FaTag />}>
                <input
                  className={styles.field}
                  value={form.name}
                  onChange={(e) => updateForm({ name: e.target.value })}
                  placeholder="Ex: T-Shirt Clássica"
                  required
                />
              </Field>

              <Field label="Descrição" icon={<FaAlignLeft />} iconAlignTop>
                <textarea
                  className={styles.field}
                  value={form.description}
                  onChange={(e) => updateForm({ description: e.target.value })}
                  placeholder="Detalhes do produto..."
                  rows={3}
                />
              </Field>

              <Field label="Categoria" icon={<FaFolder />}>
                <MultiSelectDropdown
                  availableItems={categoryOptions}
                  selectedItems={form.category ? [form.category] : []}
                  onChange={(items) => updateForm({ category: items[0] ?? "" })}
                  onItemCreate={handleCategoryCreate}
                  placeholder={form.category || "Escolha ou cria categoria"}
                  multiSelect={false}
                />
              </Field>

              <Field label="Preço Base" icon={<FaEuroSign />}>
                <input
                  className={styles.field}
                  type="number"
                  value={form.price}
                  onChange={(e) => updateForm({ price: Number(e.target.value) })}
                  step="0.01"
                  min="0"
                  required
                />
              </Field>
            </div>

            <div className={styles.stackBlock}>
              <SectionTitle icon={<FaBox />}>Stock</SectionTitle>

              <Field label="Tipo de Stock" icon={<FaLayerGroup />}>
                <MultiSelectDropdown
                  availableItems={["Stock Limitado", "Sob Encomenda"]}
                  selectedItems={[
                    form.stock_type === "on_demand" ? "Sob Encomenda" : "Stock Limitado",
                  ]}
                  onChange={([item]) => {
                    const stock_type = item === "Sob Encomenda" ? "on_demand" : "limited";
                    updateForm({
                      stock_type,
                      ...(stock_type === "limited" && !hasVariants ? { stock_quantity: 0 } : {}),
                    });
                  }}
                  placeholder={form.stock_type === "on_demand" ? "Sob Encomenda" : "Stock Limitado"}
                  multiSelect={false}
                  disabled={uploading}
                />
              </Field>

              {form.stock_type === "limited" ? (
                <Field label="Quantidade Total" icon={<FaBox />}>
                  <input
                    className={styles.field}
                    type="number"
                    value={hasVariants ? totalVariantStock : form.stock_quantity}
                    onChange={(e) => updateForm({ stock_quantity: Number(e.target.value) })}
                    disabled={hasVariants}
                  />
                  {hasVariants && <p className={styles.hint}>Gerido pela soma das variantes.</p>}
                </Field>
              ) : (
                <Field label="Data Limite (Opcional)" icon={<FaCalendarAlt />}>
                  <div className={styles.datePickerWrap} ref={datePickerRef}>
                    <input
                      className={styles.field}
                      type="text"
                      value={form.order_deadline?.toLocaleDateString("pt-PT") ?? ""}
                      placeholder="Selecione uma data"
                      readOnly
                      onClick={() => setShowDatePicker((p) => !p)}
                    />
                    {showDatePicker && (
                      <div
                        className={styles.datePickerPopup}
                        onClick={(e) => {
                          if (e.target === e.currentTarget) setShowDatePicker(false);
                        }}>
                        <div className={styles.datePickerPanel}>
                          <DayPicker
                            mode="single"
                            selected={form.order_deadline}
                            onSelect={(d) => {
                              updateForm({ order_deadline: d });
                              setShowDatePicker(false);
                            }}
                            weekStartsOn={1}
                            captionLayout="dropdown"
                            navLayout="around"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Field>
              )}
            </div>
          </div>

          <div className={styles.sectionCol}>
            <div className={styles.stackBlock}>
              <SectionTitle icon={<FaSlidersH />}>Variantes</SectionTitle>

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
                      placeholder="Nome (Ex: Cor)"
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
                          isColorKey(def.name) ? "Nome da cor (ex: Azul)" : "Valores (ex: S, M, L)"
                        }
                        isColor={isColorKey(def.name)}
                      />
                    </div>
                    <button
                      type="button"
                      className={styles.btnDanger}
                      onClick={() => setVariantDefinitions((p) => p.filter((_, i) => i !== idx))}>
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
                    <FaPlus size={12} /> Adicionar
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
                        Grupos
                      </button>
                    )}
                    {hasVariants && (
                      <button
                        type="button"
                        className={`${styles.tabButton} ${activeTab === "__combos__" ? styles.activeTab : ""}`}
                        onClick={() => setActiveTab("__combos__")}>
                        Combinações{" "}
                        <span className={styles.badge}>
                          {variants.filter((v) => v.active).length}
                        </span>
                      </button>
                    )}
                  </div>

                  <div className={styles.col}>
                    {activeTab === "__groups__" && (
                      <>
                        {groupKeys.length > 0 && secondaryGroupsCount > 0 && (
                          <div className={styles.inputRow}>
                            <span className={styles.hint}>
                              Mostrar grupos secundários ({secondaryGroupsCount})
                            </span>
                            <ToggleSwitch
                              checked={showSecondaryGroups}
                              onChange={setShowSecondaryGroups}
                              aria-label="Mostrar grupos secundários"
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
                                  ? `${(form.price + slot.price_modifier).toFixed(2)}€`
                                  : null
                              }
                              badge={slotImages(slot).length}>
                              <div className={styles.row}>
                                <div className={styles.fieldWrap}>
                                  <span className={styles.subLabel}>Preço +/- (€)</span>
                                  <input
                                    className={styles.field}
                                    type="number"
                                    step="0.01"
                                    value={slot.price_modifier}
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
                                hint="Imagens da Variante"
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
                          setVariants((p) =>
                            p.map((vr, idx) => (idx === i ? { ...vr, ...updates } : vr))
                          );

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
                                ? `${v.price_modifier ? (form.price + v.price_modifier).toFixed(2) + "€ " : ""}${v.stock_quantity ? v.stock_quantity + "un" : ""}`
                                : null
                            }>
                            <div className={styles.row}>
                              <div className={styles.fieldWrap}>
                                <span className={styles.subLabel}>Preço +/- (€)</span>
                                <input
                                  className={styles.field}
                                  type="number"
                                  step="0.01"
                                  value={v.price_modifier}
                                  onChange={(e) =>
                                    updateVariant({ price_modifier: Number(e.target.value) })
                                  }
                                  disabled={!v.active}
                                />
                              </div>
                              <div className={styles.fieldWrap}>
                                <span className={styles.subLabel}>Stock (un)</span>
                                <input
                                  className={styles.field}
                                  type="number"
                                  value={v.stock_quantity}
                                  onChange={(e) =>
                                    updateVariant({ stock_quantity: Number(e.target.value) })
                                  }
                                  disabled={!v.active || form.stock_type === "on_demand"}
                                />
                              </div>
                            </div>
                            <ImageGrid
                              hint="Imagens Específicas"
                              images={imgs}
                              onAdd={(f) =>
                                updateVariant({
                                  newImages: [
                                    ...v.newImages,
                                    { file: f, preview: URL.createObjectURL(f) },
                                  ],
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

            {showGlobalImages && (
              <div className={styles.stackBlock}>
                <SectionTitle icon={<FaImages />}>Imagens</SectionTitle>
                <ImageGrid
                  images={allGlobalImages}
                  onAdd={(f) =>
                    setProductImages((p) => ({
                      ...p,
                      new: [...p.new, { file: f, preview: URL.createObjectURL(f) }],
                    }))
                  }
                  onRemove={(i) =>
                    i < productImages.existing.length
                      ? setProductImages((p) => ({
                          ...p,
                          existing: p.existing.filter((_, idx) => idx !== i),
                        }))
                      : setProductImages((p) => ({
                          ...p,
                          new: p.new.filter((_, idx) => idx !== i - p.existing.length),
                        }))
                  }
                />
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
