import React from 'react';
import { Button } from '@/components/ui/button';
import styles from '@/styles/components/blog/mainpage/ManageTagsModal.module.css';

interface TagsFormProps {
  tagsByCategory: Record<string, { id: number; name: string }[]>;
  newTagCategory: string;
  setNewTagCategory: (v: string) => void;
  newTagName: string;
  setNewTagName: (v: string) => void;
  handleCreateTag: (category: string, name: string) => void;
}

const TagsForm: React.FC<TagsFormProps> = ({ tagsByCategory, newTagCategory, setNewTagCategory, newTagName, setNewTagName, handleCreateTag }) => (
  <form
    className={styles.newTagForm}
    onSubmit={e => {
      e.preventDefault();
      if (newTagCategory && newTagName) {
        handleCreateTag(newTagCategory, newTagName);
        setNewTagCategory('');
        setNewTagName('');
      }
    }}
  >
    <div className={styles.categorySelectWrapper}>
      <select
        className={styles.input}
        value={newTagCategory}
        onChange={e => setNewTagCategory(e.target.value)}
      >
        <option value="">Escolher categoria existente</option>
        {Object.keys(tagsByCategory).map(category => (
          <option key={category} value={category}>{category}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Nova categoria"
        value={newTagCategory}
        onChange={e => setNewTagCategory(e.target.value)}
        className={styles.input}
      />
    </div>
    <input
      type="text"
      placeholder="Nome da tag"
      value={newTagName}
      onChange={e => setNewTagName(e.target.value)}
      className={styles.input}
      required
    />
    <Button type="submit">Criar tag</Button>
  </form>
);

export default TagsForm;
