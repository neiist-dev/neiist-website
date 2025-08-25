import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { UserRole } from "@/types/user";
import { addProduct, addProductVariant, getUser } from "@/utils/dbUtils";
import path from "path";
import fs from "fs/promises";

async function checkAdminPermission(): Promise<{ isAuthorized: boolean; error?: NextResponse }> {
  const accessToken = (await cookies()).get("accessToken")?.value;
  if (!accessToken) {
    return {
      isAuthorized: false,
      error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  try {
    const userData = JSON.parse((await cookies()).get("userData")?.value || "null");
    if (!userData) {
      return {
        isAuthorized: false,
        error: NextResponse.json({ error: "User data not found" }, { status: 404 }),
      };
    }

    const currentUser = await getUser(userData.istid);
    if (!currentUser) {
      return {
        isAuthorized: false,
        error: NextResponse.json({ error: "Current user not found" }, { status: 404 }),
      };
    }

    const isAdmin = currentUser.roles.includes(UserRole._ADMIN);

    if (!isAdmin) {
      return {
        isAuthorized: false,
        error: NextResponse.json(
          { error: "Insufficient permissions - Admin required" },
          { status: 403 }
        ),
      };
    }
    return { isAuthorized: true };
  } catch (error) {
    console.error("Error checking permissions:", error);
    return {
      isAuthorized: false,
      error: NextResponse.json({ error: "Internal server error" }, { status: 500 }),
    };
  }
}

function sanitizeImageName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  return base.endsWith(".jpg") ? base : `${base}.jpg`;
}

async function uploadImages(
  imageUploads: Array<{ imageBase64: string; imageName: string }>
): Promise<string[]> {
  const uploadDir = path.join(process.cwd(), "public", "products");
  await fs.mkdir(uploadDir, { recursive: true });

  const uploadedPaths: string[] = [];

  for (const upload of imageUploads) {
    const buffer = Buffer.from(upload.imageBase64, "base64");
    const sanitizedName = sanitizeImageName(upload.imageName);
    const filePath = path.join(uploadDir, sanitizedName);
    await fs.writeFile(filePath, buffer);
    uploadedPaths.push(`/products/${sanitizedName}`);
  }

  return uploadedPaths;
}

export async function POST(request: NextRequest) {
  const permissionCheck = await checkAdminPermission();
  if (!permissionCheck.isAuthorized) return permissionCheck.error;

  try {
    const body = await request.json();
    let finalImages = body.images || [];
    if (body.imageUploads && body.imageUploads.length > 0) {
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
      stock_quantity: body.stock_quantity,
      order_deadline: body.order_deadline,
      estimated_delivery: body.estimated_delivery,
      active: true,
    });

    if (!newProduct) {
      return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }

    if (body.variants && body.variants.length > 0) {
      for (const variant of body.variants) {
        await addProductVariant(newProduct.id, {
          variant_name: variant.variant_name,
          variant_value: variant.variant_value,
          price_modifier: variant.price_modifier,
          images: variant.images,
          stock_quantity: variant.stock_quantity,
          size: variant.size,
          active: variant.active,
        });
      }
    }

    return NextResponse.json(
      {
        message: "Product created successfully",
        product: newProduct,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
