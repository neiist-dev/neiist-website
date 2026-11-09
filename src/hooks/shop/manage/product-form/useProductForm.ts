"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@neiist/ui";
import {
  Product,
  ProductVariant,
  ProductType,
  StockType,
  ProductChannel,
} from "@/types/shop/product";
import { Category } from "@/types/shop/category";
import { isColorKey, joinNameHex, splitNameHex } from "@/utils/shop/shopUtils";
import { variantValue } from "@/components/shop/manage/product-form/VariantOptionsEditor";
import {
  createProductAction,
  updateProductAction,
  SaveProductInput,
} from "@/actions/shop/products";
import { createCategoryAction } from "@/actions/shop/categories";
import type { Dictionary } from "@/i18n/dictionaries";

export type ImageFile = { file: File; preview: string };
export type VariantDefinition = { id: string; name: string; values: variantValue[] };
export type GroupSlot = { existing: string[]; newFiles: ImageFile[]; price_modifier: number };
export type GroupImages = Record<string, GroupSlot>;
export type VariantForm = {
  id?: number;
  options: Record<string, string>;
  price_modifier: number;
  stock_quantity: number;
  active: boolean;
  existingImages: string[];
  newImages: ImageFile[];
};

export const emptyGroupSlot = (): GroupSlot => ({ existing: [], newFiles: [], price_modifier: 0 });

export const normalizeOptVal = (type: string, raw: string) => {
  if (!isColorKey(type)) return raw;
  const { name, hex } = splitNameHex(raw);
  return hex ? joinNameHex(name, hex) : raw;
};

export const groupKeyFromOption = (type: string, value: string) =>
  `${type}::${normalizeOptVal(type, value)}`;

export const optValMatches = (type: string, varVal: string, grpVal: string) =>
  isColorKey(type) ? splitNameHex(varVal).hex === splitNameHex(grpVal).hex : varVal === grpVal;

export const getGroupPriceModifier = (
  variants: ProductVariant[],
  optType: string,
  optVal: string
): number => {
  const matching = variants.filter(
    (v) => normalizeOptVal(optType, String(v.options?.[optType] ?? "")) === optVal
  );
  if (!matching.length) return 0;

  const modifiers = new Set(matching.map((v) => Number(v.price_modifier ?? 0)));
  return modifiers.size === 1 ? Number(matching[0].price_modifier ?? 0) : 0;
};

export const buildInitialGroupImages = (variants: ProductVariant[] | undefined): GroupImages => {
  if (!variants?.length) return {};

  const initial: GroupImages = {};

  variants.forEach((variant) => {
    Object.entries(variant.options ?? {}).forEach(([type, value]) => {
      const key = groupKeyFromOption(type, String(value).replace(/["']/g, ""));
      if (!initial[key]) {
        const normalizedValue = key.split("::")[1] ?? "";
        initial[key] = {
          ...emptyGroupSlot(),
          price_modifier: getGroupPriceModifier(variants, type, normalizedValue),
        };
      }
    });
  });

  Object.entries(initial).forEach(([key, slot]) => {
    const [optType, optVal] = key.split("::");
    const seen = new Set<string>();

    variants
      .filter(
        (variant) => normalizeOptVal(optType, String(variant.options?.[optType] ?? "")) === optVal
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
};

export const slotImages = (slot: GroupSlot) => [
  ...slot.existing,
  ...slot.newFiles.map((f) => f.preview),
];

const cartesian = <T>(sets: T[][]): T[][] =>
  sets.reduce<T[][]>((acc, set) => acc.flatMap((x) => set.map((y) => [...x, y])), [[]]);

async function uploadShopFiles(files: File[]): Promise<string[]> {
  if (!files || files.length === 0) return [];

  return Promise.all(
    files.map(async (file) => {
      const fd = new FormData();
      fd.append("files", file);
      const res = await fetch("/api/shop/uploads", { method: "POST", body: fd });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error ? `${errorData.error} (${file.name})` : `Erro ao carregar: ${file.name}`
        );
      }
      const data = await res.json();
      const path = data.paths?.[0];
      if (!path) throw new Error(`Erro ao carregar: ${file.name}`);
      return path as string;
    })
  );
}

export function useProductForm({
  product,
  isEdit = false,
  backHref = "/shop/manage",
  categories: initialCategories,
  dict,
}: {
  product?: Product;
  isEdit?: boolean;
  backHref?: string;
  categories: Category[];
  dict: Dictionary["shop"]["product_form"];
}) {
  const router = useRouter();

  const [form, setForm] = useState(() => ({
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product?.price ?? 0,
    category: product?.category ?? "",
    product_type: (product?.product_type as ProductType) ?? "merchandise",
    channels: (product?.channels as ProductChannel[]) ?? ["web", "pos"],
    event_id: product?.event_id ?? "",
    event_hook: (product?.event_hook as "default_signup") ?? "default_signup",
    stock_type: (product?.stock_type as StockType) ?? "limited",
    stock_quantity: product?.stock_quantity ?? 0,
    order_start: product?.order_start ? new Date(product.order_start) : undefined,
    order_deadline: product?.order_deadline ? new Date(product.order_deadline) : undefined,
    estimated_delivery: product?.estimated_delivery ?? "",
    size_guide: product?.size_guide ?? "",
  }));

  const updateForm = useCallback((updates: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const [allCategories, setAllCategories] = useState<Category[]>(initialCategories);
  const [uploading, setUploading] = useState(false);

  const [productImages, setProductImages] = useState<{ existing: string[]; new: ImageFile[] }>({
    existing: product?.images ?? [],
    new: [],
  });

  const initialVariantIdsRef = useRef<Set<number>>(
    new Set(product?.variants?.map((v) => v.id) ?? [])
  );
  const hasInitializedFromProductRef = useRef(!!product?.variants?.length);

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

  const [variants, setVariants] = useState<VariantForm[]>(() => {
    return (
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
        active: v.active,
        existingImages: v.images ?? [],
        newImages: [],
      })) ?? []
    );
  });

  const [groupImages, setGroupImages] = useState<GroupImages>(() =>
    buildInitialGroupImages(product?.variants)
  );

  const categoryOptions = useMemo(() => allCategories.map((c) => c.name).sort(), [allCategories]);
  const hasVariants = variants.length > 0;
  const totalVariantStock = variants.reduce(
    (acc, v) => acc + (v.active ? Number(v.stock_quantity) : 0),
    0
  );

  const allGlobalImages = useMemo(
    () => [...productImages.existing, ...productImages.new.map((f) => f.preview)],
    [productImages]
  );

  const hasAnyVariantSpecificImage = useMemo(
    () =>
      variants.some((v) => v.existingImages.length > 0 || v.newImages.length > 0) ||
      Object.values(groupImages).some((s) => s.existing.length > 0 || s.newFiles.length > 0),
    [variants, groupImages]
  );

  // Sync variants when definitions change
  useEffect(() => {
    if (hasInitializedFromProductRef.current) {
      hasInitializedFromProductRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const valid = variantDefinitions.filter((d) => d.name && d.values.length > 0);
      if (!valid.length) {
        setVariants([]);
        setGroupImages({});
        return;
      }

      const names = valid.map((d) => d.name);
      const newCombos = cartesian(valid.map((d) => d.values)).map((combo) => {
        const opts: Record<string, string> = {};
        valid.forEach((d, i) => {
          const val = combo[i];
          opts[d.name] = typeof val === "string" ? val : joinNameHex(val.name, val.color);
        });
        return opts;
      });

      setVariants((prev) => {
        const getOptsKey = (opts: Record<string, string>) =>
          JSON.stringify(names.reduce((acc, k) => ({ ...acc, [k]: opts[k] }), {}));
        const prevMap = new Map<string, VariantForm>();
        prev.forEach((v) => {
          const key = getOptsKey(v.options);
          if (!prevMap.has(key)) prevMap.set(key, v);
        });

        return newCombos.map((opts) => {
          const key = getOptsKey(opts);
          const existing = prevMap.get(key);
          if (existing) return existing;
          return {
            options: opts,
            price_modifier: 0,
            stock_quantity: 0,
            active: true,
            existingImages: [],
            newImages: [],
          };
        });
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [variantDefinitions]);

  const handleCategoryCreate = async (name: string) => {
    try {
      const created = await createCategoryAction(name);
      setAllCategories((prev) => [...prev, created]);
      updateForm({ category: created.name });
      Alert.success(`Categoria "${created.name}" criada`);
    } catch {
      Alert.error("Erro ao criar categoria");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      Alert.error(dict.product_name_label);
      return;
    }

    setUploading(true);
    try {
      const newGlobalPaths = await uploadShopFiles(productImages.new.map((img) => img.file));
      const finalGlobalImages = [...productImages.existing, ...newGlobalPaths];
      const currentVariantIds = new Set(variants.map((v) => v.id).filter(Boolean) as number[]);
      const variantsToDelete = Array.from(initialVariantIdsRef.current).filter(
        (id) => !currentVariantIds.has(id)
      );

      const variantsPayload = [];
      for (const variant of variants) {
        const newVariantPaths = await uploadShopFiles(variant.newImages.map((img) => img.file));

        variantsPayload.push({
          id: variant.id,
          sku: null,
          images: [...variant.existingImages, ...newVariantPaths],
          price_modifier: Number(variant.price_modifier) || 0,
          stock_quantity:
            form.stock_type === "limited" ? Number(variant.stock_quantity) || 0 : null,
          active: variant.active,
          options: variant.options,
        });
      }

      const groupUploadsEntries: [
        string,
        {
          existing: string[];
          price_modifier: number;
          stock_quantity: number;
        },
      ][] = [];

      for (const [key, slot] of Object.entries(groupImages)) {
        const newGroupPaths = await uploadShopFiles(slot.newFiles.map((f) => f.file));
        groupUploadsEntries.push([
          key,
          {
            existing: [...slot.existing, ...newGroupPaths],
            price_modifier: slot.price_modifier || 0,
            stock_quantity: 0,
          },
        ]);
      }

      const payload: SaveProductInput = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price) || 0,
        category: form.category,
        product_type: form.product_type,
        channels: form.channels,
        event_id: form.product_type === "event_ticket" ? form.event_id.trim() || null : null,
        event_hook: form.product_type === "event_ticket" ? form.event_hook : null,
        stock_type: form.stock_type,
        stock_quantity:
          form.stock_type === "limited"
            ? hasVariants
              ? totalVariantStock
              : Number(form.stock_quantity) || 0
            : null,
        images: finalGlobalImages,
        group_image_uploads: Object.fromEntries(groupUploadsEntries),
        variants: variantsPayload,
        variantsToDelete,
        order_start: form.order_start?.toISOString() ?? null,
        order_deadline: form.order_deadline?.toISOString() ?? null,
        estimated_delivery: form.estimated_delivery.trim() || null,
        size_guide: form.size_guide.trim() || null,
      };

      if (isEdit && product?.id) {
        await updateProductAction(product.id, payload);
        Alert.success(dict.save_changes || "Artigo atualizado!");
      } else {
        await createProductAction(payload);
        Alert.success(dict.create_product || "Artigo criado com sucesso!");
      }

      router.replace(backHref);
    } catch (err) {
      Alert.error(err instanceof Error ? err.message : dict.error_save);
    } finally {
      setUploading(false);
    }
  };

  return {
    form,
    updateForm,
    categoryOptions,
    allCategories,
    handleCategoryCreate,
    productImages,
    setProductImages,
    variantDefinitions,
    setVariantDefinitions,
    variants,
    setVariants,
    groupImages,
    setGroupImages,
    hasVariants,
    totalVariantStock,
    allGlobalImages,
    hasAnyVariantSpecificImage,
    uploading,
    handleSubmit,
    router,
  };
}
