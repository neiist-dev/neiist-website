import { NextRequest, NextResponse } from "next/server";
import { updateProduct, updateProductVariant, getProduct } from "@/utils/dbUtils";
import { Product } from "@/types/shop";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const productId = Number(id);
    const body: Product = await request.json();
    const updatedProduct = await updateProduct(productId, {
      name: body.name,
      description: body.description,
      price: body.price,
      images: body.images,
      category: body.category,
      stock_type: body.stock_type,
      stock_quantity: body.stock_quantity,
      order_deadline: body.order_deadline,
      estimated_delivery: body.estimated_delivery,
      active: true,
    });

    if (!updatedProduct) {
      return NextResponse.json({ error: "Product not found or failed to update" }, { status: 404 });
    }

    if (body.variants && body.variants.length > 0) {
      for (const variant of body.variants) {
        if (variant.id) {
          await updateProductVariant(productId, variant.id, {
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
