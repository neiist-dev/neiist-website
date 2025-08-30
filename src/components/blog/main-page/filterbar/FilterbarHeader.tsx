import React from 'react';
import styles from '@/styles/components/blog/mainpage/BlogFilterBar.module.css';
import { FaChevronLeft, FaEdit } from 'react-icons/fa';
import { Button } from '@/components/ui/button';

interface FilterbarHeaderProps {
  onClose: () => void;
  isMember: boolean;
  onEdit: () => void;
}

const FilterbarHeader: React.FC<FilterbarHeaderProps> = ({ onClose, isMember, onEdit }) => (
  <div className={styles.filterbarHeader}>
    <span className={styles.filterbarTitle}>Filtros</span>
    <button onClick={onClose} className={styles.filterbarClose}>
      <FaChevronLeft />
    </button>
  </div>
);

export default FilterbarHeader;
