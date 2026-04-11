"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { FaEdit } from "react-icons/fa";
import { FiArchive, FiImage, FiTrash2 } from "react-icons/fi";
import { MdOutlineUnarchive } from "react-icons/md";
import { Product } from "@/types/shop";
import styles from "@/styles/components/shop/ProductManagementCard.module.css";

interface Props {
  product: Product;
  onEdit: (_id: number) => void;
  onArchive: (_id: number) => void;
  onRestore: (_id: number) => void;
  onPermanentDelete: (_id: number) => void;
}

export default function ProductManagementCard({
  product,
  onEdit,
  onArchive,
  onRestore,
  onPermanentDelete,
}: Props) {
  const [imageIndex, setImageIndex] = useState(0);

  const images = useMemo(() => {
    const allImgs = [
      ...(product.images || []),
      ...(product.variants?.flatMap((v) => v.images || []) || []),
    ];
    return Array.from(new Set(allImgs));
  }, [product.images, product.variants]);

  const stockInfo = useMemo(() => {
    if (product.stock_type === "on_demand") {
      return { label: "Sob Encomenda", status: "on-demand" };
    }
    const total =
      product.variants?.length > 0
        ? product.variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
        : product.stock_quantity || 0;
    if (total === 0) return { label: "Sem stock", status: "out-of-stock" };
    return { label: `${total} em stock`, status: "in-stock" };
  }, [product]);

  const currentImage = images[imageIndex];

  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        {currentImage ? (
          <Image
            src={currentImage}
            alt={product.name}
            fill
            onError={() => setImageIndex((prev) => Math.min(prev + 1, images.length - 1))}
          />
        ) : (
          <div className={styles.placeholder}>
            <FiImage size={40} />
            <span>Sem Imagem</span>
          </div>
        )}

        <span className={`${styles.badge} ${styles[stockInfo.status]}`}>{stockInfo.label}</span>

        {!product.active && <span className={styles.archivedBadge}>Arquivado</span>}
      </div>

      {images.length > 1 && (
        <div className={styles.thumbnails}>
          {images.map((img, idx) => (
            <button
              key={img + idx}
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

        <div className={styles.price}>{product.price}€</div>

        <span className={styles.tagCategory}>{product.category}</span>

        <div className={styles.actions}>
          {product.active !== false ? (
            <>
              <button onClick={() => onEdit(product.id)} className={styles.btnPrimary}>
                <FaEdit /> Editar
              </button>
              <button onClick={() => onArchive(product.id)} className={styles.btnSecondary}>
                <FiArchive /> Arquivar
              </button>
            </>
          ) : (
            <>
              <button onClick={() => onRestore(product.id)} className={styles.btnRestore}>
                <MdOutlineUnarchive /> Restaurar
              </button>
              <button onClick={() => onPermanentDelete(product.id)} className={styles.btnDanger}>
                <FiTrash2 /> Eliminar
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
