import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/types/user";
import {
  updateProduct,
  updateProductVariant,
  getProduct,
  addProductVariant,
} from "@/utils/dbUtils";
import path from "path";
import fs from "fs/promises";
import { serverCheckRoles } from "@/utils/permissionUtils";

function isImage(buffer: Buffer): boolean {
  // JPEG magic: FF D8 FF
  const isJpeg =
    buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  // PNG magic: 89 50 4E 47 0D 0A 1A 0A
  const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const isPng = buffer.length >= 8 && buffer.subarray(0, 8).equals(pngSig);
  return isJpeg || isPng;
}

async function uploadImages(
  imageUploads: Array<{ imageBase64: string; imageName: string }>
): Promise<string[]> {
  const uploadDir = path.join(process.cwd(), "public", "products");
  await fs.mkdir(uploadDir, { recursive: true });
  const uploadedPaths: string[] = [];

  for (const upload of imageUploads) {
    const buffer = Buffer.from(upload.imageBase64, "base64");
    if (!isImage(buffer)) {
      throw new Error("Only image uploads are allowed");
    }
    const imageName = path.basename(upload.imageName);
    const filePath = path.join(uploadDir, imageName);
    await fs.writeFile(filePath, buffer);
    uploadedPaths.push(`/products/${imageName}`);
  }

  return uploadedPaths;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userRoles = await serverCheckRoles([UserRole._ADMIN]);
  if (!userRoles.isAuthorized) return userRoles.error;

  try {
    const { id } = await params;
    const productId = Number(id);
    const body = await request.json();
    let finalImages = body.images || [];
    if (Array.isArray(body.imageUploads) && body.imageUploads.length > 0) {
      const uploadedImages = await uploadImages(body.imageUploads);
      finalImages = [...finalImages, ...uploadedImages];
    }

    await updateProduct(productId, {
      name: body.name,
      description: body.description,
      price: body.price,
      images: finalImages,
      category: body.category,
      stock_type: body.stock_type,
      stock_quantity: body.stock_quantity,
      order_deadline: body.order_deadline,
      active: true,
    });

    if (Array.isArray(body.variants) && body.variants.length > 0) {
      for (const variant of body.variants) {
        let variantImages: string[] = variant.images || [];
        if (Array.isArray(variant.imageUploads) && variant.imageUploads.length > 0) {
          const uploadedVariantImages = await uploadImages(variant.imageUploads);
          variantImages = [...variantImages, ...uploadedVariantImages];
        }
        if (variant.id) {
          await updateProductVariant(variant.id, {
            sku: variant.sku,
            images: variantImages,
            price_modifier: variant.price_modifier ?? 0,
            stock_quantity: variant.stock_quantity,
            active: variant.active ?? true,
            options: variant.options ?? {},
          });
        } else {
          await addProductVariant(productId, {
            sku: variant.sku,
            images: variantImages,
            price_modifier: variant.price_modifier ?? 0,
            stock_quantity: variant.stock_quantity,
            active: variant.active ?? true,
            options: variant.options ?? {},
          });
        }
      }
    }

    const updatedProduct = await getProduct(productId);
    if (!updatedProduct) {
      return NextResponse.json({ error: "Product not found or failed to update" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userRoles = await serverCheckRoles([UserRole._ADMIN]);
  if (!userRoles.isAuthorized) return userRoles.error;

  try {
    const { id } = await params;
    const productId = Number(id);
    const deletedProduct = await updateProduct(productId, { active: false });

    if (!deletedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const productId = Number(id);

    const product = await getProduct(productId);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}
