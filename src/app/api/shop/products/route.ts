import { NextRequest, NextResponse } from "next/server";
import { addProduct, addProductVariant } from "@/utils/dbUtils";
import { Product } from "@/types/shop";

export async function POST(request: NextRequest) {
  try {
    const body: Product = await request.json();
    const newProduct = await addProduct({
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
