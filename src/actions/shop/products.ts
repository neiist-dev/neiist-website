"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requirePermission } from "@/lib/auth";
import {
  addProduct,
  changeProductStock,
  updateProduct,
  syncProductVariants,
  deleteProduct,
  getProduct,
  getProductNoCache,
  setProductSalesEnabled,
} from "@/lib/db/repositories/shop.repository";
import { Product, ProductVariantInput, StockChangeInput } from "@/types/shop/product";

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
  variants?: ProductVariantInput[];
  variantsToDelete?: number[];
}

function revalidateProductCaches(id: number): void {
  revalidateTag("products", "max");
  revalidateTag(`product-${id}`, "max");
  revalidatePath("/shop");
  revalidatePath("/shop/manage");
  revalidatePath("/[locale]/shop/manage", "page");
  revalidatePath(`/shop/${id}`);
  revalidatePath("/dinner");
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

    await syncProductVariants(newProduct.id, processedVariants);
  }

  revalidateProductCaches(newProduct.id);

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

  revalidateProductCaches(id);

  const fullProduct = await getProduct(id);
  if (!fullProduct) throw new Error("Artigo não encontrado após atualização");
  return fullProduct;
}

export async function deleteProductAction(id: number): Promise<{ success: boolean }> {
  await requirePermission("shop:write");

  const existing = await getProductNoCache(id);
  if (!existing) throw new Error("Artigo não encontrado");
  if (existing.active !== false)
    throw new Error("Desative as vendas antes de eliminar definitivamente");

  await deleteProduct(id);
  revalidateProductCaches(id);

  return { success: true };
}

export async function setProductSalesEnabledAction(id: number, enabled: boolean): Promise<Product> {
  await requirePermission("shop:write");

  const updated = await setProductSalesEnabled(id, enabled);
  if (!updated) throw new Error("Artigo não encontrado");

  revalidateProductCaches(id);
  return updated;
}

export async function changeProductStockAction(
  productId: number,
  changes: StockChangeInput[]
): Promise<Product> {
  await requirePermission("shop:write");

  if (!Array.isArray(changes) || changes.length === 0)
    throw new Error("Nenhuma alteração de stock especificada");

  for (const item of changes) {
    if (item.delta !== undefined && !Number.isInteger(item.delta))
      throw new Error("Variação de stock inválida");

    if (item.set !== undefined && (!Number.isInteger(item.set) || item.set < 0))
      throw new Error("Quantidade de stock inválida");

    if (item.delta === undefined && item.set === undefined)
      throw new Error("Nenhuma alteração de stock especificada");
  }

  const updated = await changeProductStock(productId, changes);
  if (!updated) throw new Error("Artigo não encontrado");

  revalidateProductCaches(productId);
  return updated;
}
