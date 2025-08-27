import React from 'react';
import styles from '@/styles/components/blog/mainpage/BlogFilterBar.module.css';

interface FilterbarTagsProps {
  tagsByCategory: Record<string, { id: number, name: string }[]>;
  selected: string[];
  setSelected: (tags: string[]) => void;
}

const FilterbarTags: React.FC<FilterbarTagsProps> = ({ tagsByCategory, selected, setSelected }) => (
  <>
    {Object.entries(tagsByCategory).map(([category, tags]) => (
      <div key={category} className={styles.categoryBlock}>
        <div className={styles.categoryLabel}>{category}</div>
        <div className={styles.tags}>
          {tags.map(tag => (
            <label key={tag.id} className={styles.tagLabel}>
              <input
                type="checkbox"
                checked={selected.includes(tag.name)}
                onChange={e => {
                  if (e.target.checked) {
                    setSelected([...selected, tag.name]);
                  } else {
                    setSelected(selected.filter(t => t !== tag.name));
                  }
                }}
              />
              <span className={styles.tagName}>{tag.name}</span>
            </label>
          ))}
        </div>
      </div>
    ))}
  </>
);

export default FilterbarTags;
