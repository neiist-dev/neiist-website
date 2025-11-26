"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Shared/Button";
import { Product, CartItem } from "@/types/shop";

export default function ProductInfo({ product }: { product: Product }) {
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    (product.variants?.[0]?.options && Object.values(product.variants[0].options)[0]) || undefined
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();

  const optionNames = useMemo(() => {
    const all = new Set<string>();
    product.variants.forEach((v) => Object.keys(v.options || {}).forEach((k) => all.add(k)));
    return Array.from(all);
  }, [product.variants]);

  const mainOption = optionNames[0] || "";
  const subOption = optionNames[1] || "";

  const mainValues = useMemo(() => {
    const set = new Set<string>();
    product.variants.forEach((v) => {
      if (v.options?.[mainOption]) set.add(v.options[mainOption]);
    });
    return Array.from(set);
  }, [product.variants, mainOption]);

  const [selectedMain, setSelectedMain] = useState(mainValues[0] || "");

  const subValues = useMemo(() => {
    const set = new Set<string>();
    product.variants.forEach((v) => {
      if (v.options?.[mainOption] === selectedMain && v.options?.[subOption]) set.add(v.options[subOption]);
    });
    return Array.from(set);
  }, [product.variants, mainOption, subOption, selectedMain]);

  const [selectedSub, setSelectedSub] = useState(subValues[0] || "");

  const selectedVariant = useMemo(() => {
    return product.variants.find((v) => {
      const mainValue = v.options?.[mainOption] ?? "";
      const subValue = v.options?.[subOption] ?? "";
      return mainValue === selectedMain && subValue === selectedSub;
    });
  }, [product.variants, mainOption, subOption, selectedMain, selectedSub]);

  const price = useMemo(() => {
    return (product.price || 0) + (selectedVariant?.price_modifier || 0);
  }, [product.price, selectedVariant]);

  const handleAddToCart = () => {
    if (subOption && !selectedSub) {
      alert("Please select a size");
      return;
    }

    const cart: CartItem[] = JSON.parse(localStorage.getItem("cart") || "[]");
    cart.push({ product, variantId: selectedVariant?.id, quantity });
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    alert(`Added ${quantity} x ${product.name} to cart!`);
    router.push("/shop");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 32, margin: 0 }}>{product.name}</h1>
        <p style={{ fontSize: 20, margin: "8px 0", color: "#111827" }}>{price.toFixed(2)}€</p>
      </div>

      <div style={{ color: "#6b7280" }}>{product.description}</div>

      {mainOption && (
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>{mainOption}</div>
          <div style={{ display: "flex", gap: 8 }}>
            {mainValues.map((val) => (
              <button key={val} onClick={() => setSelectedMain(val)} style={{ padding: "8px 12px", borderRadius: 8, border: selectedMain === val ? "2px solid #111827" : "1px solid #e5e7eb", background: selectedMain === val ? "#111827" : "#fff", color: selectedMain === val ? "#fff" : "#111827" }}>
                {val}
              </button>
            ))}
          </div>
        </div>
      )}

      {subOption && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>Size</div>
            <button style={{ fontSize: 13, color: "#2563eb", background: "transparent", border: "none" }}>Unsure about size? Check our guide</button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {subValues.map((s) => (
              <button key={s} onClick={() => setSelectedSub(s)} style={{ padding: "8px 10px", borderRadius: 8, border: selectedSub === s ? "2px solid #000" : "1px solid #e5e7eb", background: selectedSub === s ? "#000" : "#fff", color: selectedSub === s ? "#fff" : "#111827" }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: 9999, padding: "6px 10px", gap: 12 }}>
          <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} style={{ border: "none", background: "transparent", cursor: "pointer" }}>-</button>
          <div style={{ width: 28, textAlign: "center", fontWeight: 600 }}>{quantity}</div>
          <button onClick={() => setQuantity((q) => q + 1)} style={{ border: "none", background: "transparent", cursor: "pointer" }}>+</button>
        </div>

        <div style={{ flex: 1 }}>
          <Button onClick={handleAddToCart}>Add to Cart</Button>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
        <details>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>Size & Fit</summary>
          <div style={{ marginTop: 8, color: "#6b7280" }}>Standard fit. Model is 180cm and wears size M.</div>
        </details>

        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>Quality Guarantee & Returns</summary>
          <div style={{ marginTop: 8, color: "#6b7280" }}>30-day return policy. Free returns on all orders.</div>
        </details>
      </div>
    </div>
  );
}
