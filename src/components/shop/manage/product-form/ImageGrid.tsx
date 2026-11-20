"use client";

import { useRef } from "react";
import Image from "next/image";
import { FaPlus, FaTrash } from "react-icons/fa";
import styles from "@/styles/components/shop/manage/ProductForm.module.css";

interface ImageGridProps {
  images: string[];
  onAdd: (_file: File) => void;
  onRemove: (_index: number) => void;
  hint?: string;
}

export function ImageGrid({ images, onAdd, onRemove, hint }: ImageGridProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className={styles.imgEditor}>
      {hint && <span className={styles.subLabel}>{hint}</span>}
      <div className={styles.imgGrid}>
        {images.map((src, i) => (
          <div key={src} className={styles.imgSlot}>
            <Image src={src} alt="" fill className={styles.imgThumb} />
            <button
              type="button"
              className={styles.imgRemove}
              onClick={() => onRemove(i)}
              aria-label="Remover imagem">
              <FaTrash size={10} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className={styles.imgAdd}
          onClick={() => inputRef.current?.click()}
          aria-label="Adicionar imagem">
          <FaPlus size={14} />
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              Array.from(e.target.files ?? []).forEach(onAdd);
              e.target.value = "";
            }}
          />
        </button>
      </div>
    </div>
  );
}
