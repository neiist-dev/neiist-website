"use client";

import { Dispatch, SetStateAction } from "react";
import { FaImages } from "react-icons/fa";
import { ImageGrid } from "./ImageGrid";
import { ImageFile } from "@/hooks/shop/manage/product-form/useProductForm";
import styles from "@/styles/components/shop/manage/ProductForm.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface ImagesSectionProps {
  productImages: { existing: string[]; new: ImageFile[] };
  setProductImages: Dispatch<SetStateAction<{ existing: string[]; new: ImageFile[] }>>;
  allGlobalImages: string[];
  dict: Dictionary["shop"]["product_form"];
}

export function ImagesSection({
  productImages,
  setProductImages,
  allGlobalImages,
  dict,
}: ImagesSectionProps) {
  return (
    <div className={styles.stackBlock}>
      <div className={styles.sectionTitle}>
        <span className={styles.sectionTitleIcon}>
          <FaImages />
        </span>
        <span>{dict.images_title}</span>
      </div>
      <ImageGrid
        images={allGlobalImages}
        onAdd={(f) =>
          setProductImages((p) => ({
            ...p,
            new: [...p.new, { file: f, preview: URL.createObjectURL(f) }],
          }))
        }
        onRemove={(i) =>
          i < productImages.existing.length
            ? setProductImages((p) => ({
                ...p,
                existing: p.existing.filter((_, idx) => idx !== i),
              }))
            : setProductImages((p) => ({
                ...p,
                new: p.new.filter((_, idx) => idx !== i - p.existing.length),
              }))
        }
      />
    </div>
  );
}
