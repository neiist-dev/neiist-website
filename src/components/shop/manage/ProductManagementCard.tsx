"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { FaEdit } from "react-icons/fa";
import { FiArchive, FiTrash2 } from "react-icons/fi";
import { MdOutlineUnarchive } from "react-icons/md";
import { Product } from "@/types/shop/product";
import { getProductTimingBadge, getProductImages } from "@/utils/shop/shopUtils";
import { formatMoney } from "@/utils/shop/moneyUtils";
import ProductImage from "@/components/shop/catalog/ProductImage";
import styles from "@/styles/components/shop/manage/ProductManagementCard.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface Props {
  product: Product;
  onEdit: (_id: number) => void;
  onArchive: (_id: number) => void;
  onRestore: (_id: number) => void;
  onPermanentDelete: (_id: number) => void;
  dict: Dictionary["shop_management"];
}

export default function ProductManagementCard({
  product,
  onEdit,
  onArchive,
  onRestore,
  onPermanentDelete,
  dict,
}: Props) {
  const [imageIndex, setImageIndex] = useState(0);

  const images = useMemo(() => getProductImages(product), [product]);

  const stockInfo = useMemo(() => {
    if (product.stock_type === "untracked")
      return { label: dict.untracked_stock, status: "untracked" };

    if (product.stock_type === "on_demand") return { label: dict.on_demand, status: "on-demand" };

    const total =
      product.variants?.length > 0
        ? product.variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
        : product.stock_quantity || 0;
    if (total === 0) return { label: dict.out_of_stock, status: "out-of-stock" };
    return { label: dict.in_stock.replace("{count}", String(total)), status: "in-stock" };
  }, [product, dict]);

  const timingBadge = getProductTimingBadge(product, dict.timing_badge);

  return (
    <article className={styles.card}>
      <ProductImage
        product={product}
        alt={product.name}
        fill
        imageIndex={imageIndex}
        onImageIndexChange={setImageIndex}
        wrapperClassName={styles.imageWrapper}
        placeholderClassName={styles.placeholder}
        placeholderLabel={dict.no_image}>
        {stockInfo && (
          <span className={`${styles.badge} ${styles[stockInfo.status]}`}>{stockInfo.label}</span>
        )}
        {timingBadge && <span className={styles.timingBadge}>{timingBadge}</span>}
        {!product.active && <span className={styles.archivedBadge}>{dict.archived_badge}</span>}
      </ProductImage>

      {images.length > 1 && (
        <div className={styles.thumbnails}>
          {images.map((img, idx) => (
            <button
              key={img}
              className={`${styles.thumbBtn} ${imageIndex === idx ? styles.activeThumb : ""}`}
              onClick={() => setImageIndex(idx)}
              aria-current={imageIndex === idx}
              type="button">
              <Image src={img} alt="" width={28} height={28} />
            </button>
          ))}
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.header}>
          <h3>{product.name}</h3>
          <p>{product.description}</p>
        </div>

        <div className={styles.price}>{formatMoney(product.price)}</div>

        <span className={styles.tagCategory}>{product.category}</span>

        <div className={styles.actions}>
          {product.active !== false ? (
            <>
              <button onClick={() => onEdit(product.id)} className={styles.btnPrimary}>
                <FaEdit /> {dict.edit}
              </button>
              <button onClick={() => onArchive(product.id)} className={styles.btnSecondary}>
                <FiArchive /> {dict.archive}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => onRestore(product.id)} className={styles.btnRestore}>
                <MdOutlineUnarchive /> {dict.restore}
              </button>
              <button onClick={() => onPermanentDelete(product.id)} className={styles.btnDanger}>
                <FiTrash2 /> {dict.delete}
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
