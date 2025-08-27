import React from 'react';
import { FaSearch } from 'react-icons/fa';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import styles from '@/styles/components/blog/mainpage/BlogToolbar.module.css';

interface BlogToolbarProps {
  onFilterClick: () => void;
  onSearch: (query: string) => void;
}

const BlogToolbar: React.FC<BlogToolbarProps> = ({ onFilterClick, onSearch }) => {
  const [search, setSearch] = React.useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    onSearch(value);
  };

  return (
    <div className={styles.toolbar}>
      <Button
        variant="default"
        onClick={onFilterClick}
        className={styles.filterButton}
      >
        Filtros
      </Button>
      <div className={styles.searchWrapper}>
        <FaSearch className={styles.searchIcon} />
        <Input
          type="text"
          placeholder="Pesquisar por artigos..."
          className={styles.searchInput}
          value={search}
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
};

export default BlogToolbar;
