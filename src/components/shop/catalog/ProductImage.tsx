"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { FiImage } from "react-icons/fi";
import { Product } from "@/types/shop/product";
import { getProductImages } from "@/utils/shop/shopUtils";

interface ProductImageProps {
  product: Product;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  imageIndex?: number;
  onImageIndexChange?: (_idx: number) => void;
  wrapperClassName: string;
  wrapperEmptyClassName?: string;
  imageClassName?: string;
  placeholderClassName: string;
  placeholderLabel: string;
  children?: ReactNode;
}

export default function ProductImage({
  product,
  alt,
  width = 300,
  height = 300,
  fill = false,
  imageIndex: controlledIndex,
  onImageIndexChange,
  wrapperClassName,
  wrapperEmptyClassName,
  imageClassName,
  placeholderClassName,
  placeholderLabel,
  children,
}: ProductImageProps) {
  const images = getProductImages(product);
  const [internalIndex, setInternalIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  const activeIndex = controlledIndex !== undefined ? controlledIndex : internalIndex;
  const updateIndex = onImageIndexChange ?? setInternalIndex;

  const currentImage = images[activeIndex];
  const showImage = Boolean(currentImage) && !hasError;

  return (
    <div
      className={
        !showImage && wrapperEmptyClassName
          ? `${wrapperClassName} ${wrapperEmptyClassName}`
          : wrapperClassName
      }>
      {showImage ? (
        fill ? (
          <Image
            src={currentImage!}
            alt={alt}
            fill
            className={imageClassName}
            onError={() => {
              if (activeIndex < images.length - 1) {
                updateIndex(activeIndex + 1);
              } else {
                setHasError(true);
              }
            }}
          />
        ) : (
          <Image
            src={currentImage!}
            alt={alt}
            width={width}
            height={height}
            className={imageClassName}
            onError={() => {
              if (activeIndex < images.length - 1) {
                updateIndex(activeIndex + 1);
              } else {
                setHasError(true);
              }
            }}
          />
        )
      ) : (
        <div className={placeholderClassName}>
          <FiImage size={40} />
          <span>{placeholderLabel}</span>
        </div>
      )}
      {children}
    </div>
  );
}
