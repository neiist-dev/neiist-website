"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Product } from "@/types/shop";

export default function ProductCard({ product }: { product: Product }) {
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    if (!product.images || product.images.length < 2) return;
    const interval = setInterval(() => {
      setImageIndex((i) => (i + 1) % product.images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [product.images]);

  return (
    <Link href={`/shop/${product.id}`} style={cardLinkStyle}>
      <div style={imageWrapperStyle}>
        {product.images && product.images[imageIndex] ? (
          <Image
            src={product.images[imageIndex]}
            alt={product.name}
            width={400}
            height={400}
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#f3f4f6" }} />
        )}
      </div>

      <div style={infoStyle}>
        <h3 style={nameStyle}>{product.name}</h3>
        <div style={priceStyle}>{product.price.toFixed(2)}€</div>
      </div>
    </Link>
  );
}

const cardLinkStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  textDecoration: "none",
  background: "#fff",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  border: "1px solid #efefef",
  gap: 12,
  width: "100%",
  boxSizing: "border-box",
};

const imageWrapperStyle: React.CSSProperties = {
  width: "100%",
  aspectRatio: "1/1",
  borderRadius: 8,
  overflow: "hidden",
  background: "#fafafa",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const infoStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 6,
};

const nameStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  color: "#111827",
  fontWeight: 600,
};

const priceStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: "#2563eb",
};
