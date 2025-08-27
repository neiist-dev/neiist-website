import React from 'react';
import styles from '@/styles/components/blog/mainpage/BlogFilterBar.module.css';
import { Button } from '@/components/ui/button';

interface FilterbarClearProps {
  onClear: () => void;
}

const FilterbarClear: React.FC<FilterbarClearProps> = ({ onClear }) => (
  <div className={styles.filterbarFooter}>
    <Button variant="outline" className={styles.clearButton} onClick={onClear}>
      Limpar filtros
    </Button>
  </div>
);

export default FilterbarClear;
