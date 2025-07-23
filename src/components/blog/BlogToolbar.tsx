import React from 'react';
import styles from '@/styles/pages/BlogPage.module.css';
import { FaSearch } from 'react-icons/fa';

interface BlogToolbarProps {
  onFilterClick: () => void;
}

const BlogToolbar: React.FC<BlogToolbarProps> = ({ onFilterClick }) => (
  <div className={styles.toolbar}>
    <button className={styles.filterButton} onClick={onFilterClick}>Filtros</button>
    <div className={styles.searchWrapper}>
      <FaSearch className={styles.searchIcon} />
      <input
        className={styles.searchBar}
        type="text"
        placeholder="Pesquisar por artigos..."
      />
    </div>
  </div>
);

export default BlogToolbar;
