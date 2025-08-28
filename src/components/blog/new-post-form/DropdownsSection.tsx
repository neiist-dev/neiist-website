import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import styles from "@/styles/components/blog/newpost-form/DropdownsSection.module.css";

interface DropdownsSectionProps {
  authors: string[];
  selectedAuthors: string[];
  onAuthorsChange: (value: string[]) => void;
  onAddAuthor: () => void;
  tagsByCategory: Record<string, { id: string, name: string }[]>;
  selectedTags: string[];
  onTagsChange: (value: string[]) => void;
  onAddTag: () => void;
}

const DropdownsSection: React.FC<DropdownsSectionProps> = ({
  authors,
  selectedAuthors = [],
  onAuthorsChange,
  onAddAuthor,
  tagsByCategory,
  selectedTags = [],
  onTagsChange,
  onAddTag,
}) => {
  const [search, setSearch] = useState("");

    return (
      <div className={styles.container}>

        <div className={styles.column}>
          <label className={styles.label}>Autores</label>
          <Select
            value={selectedAuthors.join(',')}
            onValueChange={() => {}}
            open={undefined}
          >
            <SelectTrigger className={styles.selectTrigger}>
              <SelectValue placeholder="Escolher autores" className={styles.selectValue}>
                {selectedAuthors.length ? selectedAuthors.join(', ') : ''}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className={styles.selectContent}>
              {authors.map((author) => {
                const isSelected = selectedAuthors.includes(author);
                return (
                  <div
                    key={author}
                    className={`${styles.selectItem}`}
                    onClick={e => {
                      e.stopPropagation();
                      if (isSelected) {
                        onAuthorsChange(selectedAuthors.filter(a => a !== author));
                      } else {
                        onAuthorsChange([...selectedAuthors, author]);
                      }
                    }}
                  >
                    <Checkbox checked={isSelected} className={styles.checkbox} />
                    <span>{author}</span>
                  </div>
                );
              })}
            </SelectContent>
          </Select>
          <Button type="button" variant="default" className={styles.addButton} onClick={onAddAuthor}>
            Adicionar autor
          </Button>
        </div>

        <div className={styles.column}>
          <label className={styles.label}>Tags</label>
          <Select
            value={selectedTags.length ? selectedTags.join(',') : ''}
            onValueChange={() => {}}
            open={undefined}
          >
            <SelectTrigger className={styles.selectTrigger}>
              <SelectValue placeholder="Escolher tags" className={styles.selectValue}>
                {selectedTags.length ? selectedTags.join(', ') : ''}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className={styles.selectContentTags}>
              <div className={styles.searchContainer}>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Pesquisar tag..."
                  className={styles.searchInput}
                  autoFocus
                />
              </div>
              {Object.entries(tagsByCategory).length === 0 ? (
                <div className={styles.noTags}>Nenhuma tag encontrada</div>
              ) : (
                Object.entries(tagsByCategory).map(([category, tags]) => {
                  const filtered = (tags as { id: string; name: string }[]).filter((tag) => tag.name.toLowerCase().includes(search.toLowerCase()));
                  if (filtered.length === 0) return null;
                  return (
                    <div key={category} className={styles.categoryContainer}>
                      <div className={styles.categoryTitle}>{category}</div>
                      {filtered.map((tag: { id: string; name: string }) => {
                        const isSelected = selectedTags.includes(tag.name);
                        const canSelectMore = selectedTags.length < 3;
                        return (
                          <div
                            key={tag.id}
                            className={`${styles.tagItem} ${!isSelected && !canSelectMore ? styles.tagItemDisabled : ''}`}
                            onClick={e => {
                              e.stopPropagation();
                              if (isSelected) {
                                onTagsChange(selectedTags.filter(t => t !== tag.name));
                              } else if (canSelectMore) {
                                onTagsChange([...selectedTags, tag.name]);
                              }
                            }}
                          >
                            <Checkbox checked={isSelected} className={styles.checkbox} disabled={!isSelected && !canSelectMore} />
                            <span>{tag.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </SelectContent>
          </Select>
          <Button type="button" variant="default" className={styles.addButton} onClick={onAddTag}>
            Adicionar tag
          </Button>
        </div>
      </div>
    );
};

export default DropdownsSection;
