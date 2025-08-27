import React from "react";
import styles from '@/styles/components/blog/mainpage/Pagination.module.css';

interface PaginationProps {
  page: number;
  pageCount: number;
  setPage: (page: number) => void;
}

export default function Pagination({ page, pageCount, setPage }: PaginationProps) {
  return (
    <div className={styles.pagination}>
      <button
        className={styles.nextPage}
        onClick={() => setPage(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        Anterior
      </button>
      <div className={styles.pageNumbers}>
        {Array.from({ length: pageCount }, (_, i) => (
          <button
            key={i}
            className={
              page === i + 1
                ? `${styles.pageButton} ${styles.active}`
                : styles.pageButton
            }
            onClick={() => setPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <button
        className={styles.nextPage}
        onClick={() => setPage(Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
      >
        Seguinte
      </button>
    </div>
  );
}
