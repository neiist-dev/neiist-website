"use client";
import React, { useState } from "react";
import Image from "next/image";

export default function ProductGallery({ images }: { images: string[] }) {
  const [selectedImage, setSelectedImage] = useState(images[0]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ position: "relative", aspectRatio: "4/5", borderRadius: 20, overflow: "hidden", background: "#f3f4f6", border: "1px solid #eaeaea" }}>
        {selectedImage ? (
          <Image src={selectedImage} alt="Product detail" fill style={{ objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#f3f4f6" }} />
        )}
        <button style={{ position: "absolute", top: 12, left: 12, background: "rgba(255,255,255,0.85)", borderRadius: 9999, padding: 8, border: "none" }} aria-label="zoom">
          🔍
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6 }}>
        {images.map((img, idx) => (
          <button key={idx} onClick={() => setSelectedImage(img)} style={{ width: 80, height: 80, borderRadius: 12, overflow: "hidden", border: selectedImage === img ? "2px solid #2563eb" : "1px solid #e5e7eb", background: "#fff", padding: 0 }}>
            <Image src={img} alt={`Thumbnail ${idx + 1}`} fill style={{ objectFit: "cover" }} />
          </button>
        ))}
      </div>
    </div>
  );
}
