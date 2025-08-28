import React from "react";
import Image from "next/image";
import styles from '@/styles/components/blog/post/PostHeader.module.css';

interface PostHeaderProps {
  title: string;
  image?: string;
}

export default function PostHeader({ title, image }: PostHeaderProps) {

  const getImageSrc = (img?: string) => {
    if (!img) return "/placeholder.jpg";
    if (img.startsWith('data:')) return img;
    if (/^[A-Za-z0-9+/=]+$/.test(img.substring(0, 20))) {
      return `data:image/jpeg;base64,${img}`;
    }
    return img;
  };
  return (
    <>
      <hr className={styles.divider} />
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.imageWrapper}>
        <Image
          src={getImageSrc(image)}
          alt={title}
          fill
          className={styles.image}
          sizes="(max-width: 768px) 100vw, 768px"
        />
      </div>
    </>
  );
}
