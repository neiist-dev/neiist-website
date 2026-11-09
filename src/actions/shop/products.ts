"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requirePermission } from "@/lib/auth";
import {
  addProduct,
  addProductVariants,
  updateProduct,
  syncProductVariants,
  deleteProduct,
  getProduct,
} from "@/lib/db/repositories/shop.repository";
import { Product } from "@/types/shop/product";

export interface CreateProductVariantInput {
  id?: number;
  sku?: string | null;
  images?: string[];
  price_modifier?: number;
  stock_quantity?: number | null;
  active?: boolean;
  options?: Record<string, string>;
}

export interface SaveProductInput {
  name: string;
  description?: string | null;
  price: number;
  category: string;
  stock_type: Product["stock_type"];
  stock_quantity?: number | null;
  order_start?: string | null;
  order_deadline?: string | null;
  estimated_delivery?: string | null;
  size_guide?: string | null;
  active?: boolean;
  product_type?: Product["product_type"];
  channels?: Product["channels"];
  event_id?: string | null;
  event_hook?: string | null;
  images?: string[];
  group_image_uploads?: Record<
    string,
    {
      existing: string[];
      price_modifier: number;
      stock_quantity: number;
    }
  >;
  variants?: CreateProductVariantInput[];
  variantsToDelete?: number[];
}

export async function createProductAction(data: SaveProductInput): Promise<Product> {
  await requirePermission("shop:write");

  const newProduct = await addProduct({
    name: data.name,
    description: data.description,
    price: data.price,
    images: data.images || [],
    category: data.category,
    stock_type: data.stock_type,
    stock_quantity: data.stock_quantity ?? null,
    order_start: data.order_start ?? null,
    order_deadline: data.order_deadline ?? null,
    estimated_delivery: data.estimated_delivery ?? null,
    size_guide: data.size_guide ?? null,
    active: true,
    product_type: data.product_type ?? "merchandise",
    channels:
      Array.isArray(data.channels) && data.channels.length > 0 ? data.channels : ["web", "pos"],
    event_id: data.event_id || null,
    event_hook: data.event_hook || null,
  });

  if (!newProduct) throw new Error("Falha ao criar artigo na base de dados");

  const groupImagePaths: Record<string, string[]> = {};
  for (const [key, group] of Object.entries(data.group_image_uploads ?? {})) {
    groupImagePaths[key] = group?.existing || [];
  }

  if (Array.isArray(data.variants) && data.variants.length > 0) {
    const processedVariants = [];
    for (const variant of data.variants) {
      let variantImages: string[] = variant.images || [];

      if (variantImages.length === 0) {
        for (const [optType, optVal] of Object.entries(variant.options || {})) {
          const key = `${optType}::${optVal}`;
          if (groupImagePaths[key]?.length > 0) {
            variantImages = groupImagePaths[key];
            break;
          }
        }
      }

      processedVariants.push({
        sku: variant.sku ?? null,
        images: variantImages,
        price_modifier: variant.price_modifier ?? 0,
        stock_quantity: variant.stock_quantity ?? null,
        active: variant.active ?? true,
        options: variant.options ?? {},
      });
    }

    await addProductVariants(newProduct.id, processedVariants);
  }

  revalidateTag("products", "max");
  revalidateTag(`product-${newProduct.id}`, "max");
  revalidatePath("/shop");
  revalidatePath("/shop/manage");
  revalidatePath(`/shop/${newProduct.id}`);
  revalidatePath("/dinner");

  const fullProduct = await getProduct(newProduct.id);
  return fullProduct || newProduct;
}

export async function updateProductAction(id: number, data: SaveProductInput): Promise<Product> {
  await requirePermission("shop:write");

  const updated = await updateProduct(id, {
    name: data.name,
    description: data.description,
    price: data.price,
    images: data.images || [],
    category: data.category,
    stock_type: data.stock_type,
    stock_quantity: data.stock_quantity,
    order_start: data.order_start,
    order_deadline: data.order_deadline,
    estimated_delivery: data.estimated_delivery,
    size_guide: data.size_guide,
    active: data.active ?? true,
    product_type: data.product_type,
    channels: data.channels,
    event_id: data.event_id || null,
    event_hook: data.event_hook || null,
  });

  if (!updated) throw new Error("Falha ao atualizar artigo na base de dados");

  if (
    (Array.isArray(data.variants) && data.variants.length > 0) ||
    (Array.isArray(data.variantsToDelete) && data.variantsToDelete.length > 0)
  ) {
    await syncProductVariants(id, data.variants, data.variantsToDelete);
  }

  revalidateTag("products", "max");
  revalidateTag(`product-${id}`, "max");
  revalidatePath("/shop");
  revalidatePath("/shop/manage");
  revalidatePath(`/shop/${id}`);
  revalidatePath("/dinner");

  const fullProduct = await getProduct(id);
  if (!fullProduct) throw new Error("Artigo não encontrado após atualização");
  return fullProduct;
}

export async function deleteProductAction(
  id: number,
  permanent = false
): Promise<{ success: boolean }> {
  await requirePermission("shop:write");

  if (permanent) {
    await deleteProduct(id);
  } else {
    const archived = await updateProduct(id, { active: false });
    if (!archived) throw new Error("Artigo não encontrado para arquivar");
  }

  revalidateTag("products", "max");
  revalidateTag(`product-${id}`, "max");
  revalidatePath("/shop");
  revalidatePath("/shop/manage");
  revalidatePath(`/shop/${id}`);
  revalidatePath("/dinner");

  return { success: true };
}

export async function toggleProductActiveAction(id: number, active: boolean): Promise<Product> {
  await requirePermission("shop:write");

  const updated = await updateProduct(id, { active });
  if (!updated) throw new Error("Artigo não encontrado");

  revalidateTag("products", "max");
  revalidateTag(`product-${id}`, "max");
  revalidatePath("/shop");
  revalidatePath("/shop/manage");
  revalidatePath(`/shop/${id}`);
  revalidatePath("/dinner");

  return updated;
}
