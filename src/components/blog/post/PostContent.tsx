import React from "react";
import styles from '@/styles/components/blog/post/PostContent.module.css';

interface PostContentProps {
  description: string;
}

export default function PostContent({ description }: PostContentProps) {
  return (
    <div
      className={styles.prose}
      dangerouslySetInnerHTML={{ __html: description }}
    />
  );
}
