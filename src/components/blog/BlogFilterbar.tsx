import React from 'react';
import styles from '@/styles/pages/BlogPage.module.css';
import { FaChevronLeft } from 'react-icons/fa';

interface BlogFilterbarProps {
  open: boolean;
  onClose: () => void;
}

const BlogFilterbar: React.FC<BlogFilterbarProps> = ({ open, onClose }) => (
  <>
    <div className={[
      styles.sidebar,
      open && styles.sidebarOpen
    ].filter(Boolean).join(' ')}>
      <div className={styles.sidebarHeader}>
        <span className={styles.sidebarTitle}>Filtros</span>
        <button className={styles.sidebarClose} onClick={onClose}>
          <FaChevronLeft />
        </button>
      </div>
      {/* Opções de filtros aqui futuramente */}
    </div>
    {open && <div className={styles.sidebarOverlay} onClick={onClose} />}
  </>
);

export default BlogFilterbar;
