import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/types/user";
import { addProduct, addProductVariant, getProduct } from "@/utils/dbUtils";
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

export async function POST(request: NextRequest) {
  const permissionCheck = await serverCheckRoles([UserRole._ADMIN]);
  if (!permissionCheck.isAuthorized) return permissionCheck.error;

  try {
    const body = await request.json();
    let finalImages = body.images || [];
    if (Array.isArray(body.imageUploads) && body.imageUploads.length > 0) {
      const uploadedImages = await uploadImages(body.imageUploads);
      finalImages = [...finalImages, ...uploadedImages];
    }

    const newProduct = await addProduct({
      name: body.name,
      description: body.description,
      price: body.price,
      images: finalImages,
      category: body.category,
      stock_type: body.stock_type,
      stock_quantity: body.stock_quantity ?? null,
      order_deadline: body.order_deadline ?? null,
      active: true,
    });

    if (!newProduct) {
      return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }

    // Build a map of group images: "optType::optVal" -> string[]
    const groupImagePaths: Record<string, string[]> = {};
    if (body.group_image_uploads && typeof body.group_image_uploads === "object") {
      for (const [key, groupData] of Object.entries(
        body.group_image_uploads as Record<
          string,
          {
            existing: string[];
            uploads: Array<{ imageBase64: string; imageName: string }>;
            price_modifier: number;
            stock_quantity: number;
          }
        >
      )) {
        let paths: string[] = groupData.existing || [];
        if (Array.isArray(groupData.uploads) && groupData.uploads.length > 0) {
          const uploaded = await uploadImages(groupData.uploads);
          paths = [...paths, ...uploaded];
        }
        groupImagePaths[key] = paths;
      }
    }

    for (const variant of body.variants) {
      let variantImages: string[] = variant.images || [];
      if (Array.isArray(variant.imageUploads) && variant.imageUploads.length > 0) {
        const uploadedVariantImages = await uploadImages(variant.imageUploads);
        variantImages = [...variantImages, ...uploadedVariantImages];
      }

      // Apply group images to variants that have no images of their own
      if (variantImages.length === 0) {
        for (const [optType, optVal] of Object.entries(variant.options || {})) {
          const key = `${optType}::${optVal}`;
          if (groupImagePaths[key]?.length > 0) {
            variantImages = groupImagePaths[key];
            break; // use first matching group's images
          }
        }
      }

      await addProductVariant(newProduct.id, {
        sku: variant.sku,
        images: variantImages,
        price_modifier: variant.price_modifier ?? 0,
        stock_quantity: variant.stock_quantity,
        active: variant.active ?? true,
        options: variant.options ?? {},
      });
    }

    const fullProduct = await getProduct(newProduct.id);

    return NextResponse.json(
      {
        message: "Product created successfully",
        product: fullProduct || newProduct,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
