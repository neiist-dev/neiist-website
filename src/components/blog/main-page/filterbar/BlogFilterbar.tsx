import React, { useState, useEffect } from 'react';
import styles from '@/styles/components/blog/mainpage/BlogFilterBar.module.css';
import { useUser } from '@/context/UserContext';
import { UserRole } from '@/types/user';
import FilterbarHeader from './FilterbarHeader';
import FilterbarTags from './FilterbarTags';
import FilterbarClear from './FilterbarClear';

interface BlogFilterbarProps {
  open: boolean;
  onClose: () => void;
  onFilterChange?: (filters: string[]) => void;
}

const BlogFilterbar: React.FC<BlogFilterbarProps> = ({ open, onClose, onFilterChange }) => {
  const { user } = useUser();
  const [selected, setSelected] = useState<string[]>([]);
  const [tagsByCategory, setTagsByCategory] = useState<Record<string, { id: number, name: string }[]>>({});
  const [loading, setLoading] = useState(true);
  const [showManageModal, setShowManageModal] = useState(false);
  const isMember = user && user.roles?.includes(UserRole.MEMBER);

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true); 
      try {
        const res = await fetch('/api/blog/tags');
        const data = await res.json();
        setTagsByCategory(data);
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, []);

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(selected);
    }
  }, [selected, onFilterChange]);

  // Click outside to close
  const filterbarRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (filterbarRef.current && !filterbarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);

  return (
    <div ref={filterbarRef} className={styles.filterbar + (open ? ' ' + styles.filterbarOpen : '')}>
      <FilterbarHeader onClose={onClose} isMember={isMember} onEdit={() => setShowManageModal(true)} />
      <div className={styles.filterbarDivider}></div>
      <div className={styles.scrollArea}>
        {loading ? (
          <div className={styles.loading}>A carregar...</div>
        ) : (
          <FilterbarTags tagsByCategory={tagsByCategory} selected={selected} setSelected={setSelected} />
        )}
      </div>
      {selected.length > 0 && (
        <FilterbarClear onClear={() => setSelected([])} />
      )}
    </div>
  );
};

export default BlogFilterbar;
