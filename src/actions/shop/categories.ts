"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { addCategory } from "@/lib/db/repositories/shop.repository";
import { Category } from "@/types/shop/category";

export async function createCategoryAction(name: string): Promise<Category> {
  await requirePermission("shop:write");
  const trimmed = name.trim();
  if (!trimmed) throw new Error("O nome da categoria é obrigatório");

  const category = await addCategory(trimmed);
  if (!category) throw new Error("Falha ao criar categoria");

  revalidateTag("categories", "max");
  revalidatePath("/shop");
  revalidatePath("/shop/manage");

  return category;
}
