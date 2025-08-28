import Link from 'next/link';
import { FaChevronLeft } from 'react-icons/fa';
import React from 'react';
import styles from "@/styles/components/blog/newpost-form/BackButton.module.css";

const BackButton: React.FC = () => (
  <Link href="/blog" aria-label="Voltar" className={styles.backButton}>
    <FaChevronLeft className={styles.backIcon} />
  </Link>
);

export default BackButton;
