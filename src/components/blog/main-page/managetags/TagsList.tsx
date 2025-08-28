import React from 'react';
import { FaPencilAlt, FaTrash } from 'react-icons/fa';
import styles from '@/styles/components/blog/mainpage/ManageTagsModal.module.css';

interface Tag {
  id: number;
  name: string;
}

interface TagsListProps {
  tagsByCategory: Record<string, Tag[]>;
  editTagId: number | null;
  editTagValue: string;
  setEditTagId: (id: number | null) => void;
  setEditTagValue: (v: string) => void;
  handleEditTag: (id: number, name: string) => void;
  handleDeleteTag: (id: number) => void;
  handleDeleteCategory: (category: string) => void;
}

const TagsList: React.FC<TagsListProps> = ({ tagsByCategory, editTagId, editTagValue, setEditTagId, setEditTagValue, handleEditTag, handleDeleteTag, handleDeleteCategory }) => (
  <>
    {Object.entries(tagsByCategory).map(([category, tags]) => (
      <div key={category} className={styles.categoryBlock}>
        <div className={styles.categoryLabel}>
          {category}
          <button className={styles.deleteCategoryButton} onClick={() => handleDeleteCategory(category)}>
            Eliminar categoria
          </button>
        </div>
        <ul className={styles.tagsList}>
          {tags.map(tag => (
            <li key={tag.id} className={styles.tagItem}>
              {editTagId === tag.id ? (
                <>
                  <input
                    type="text"
                    value={editTagValue}
                    onChange={e => setEditTagValue(e.target.value)}
                    className={styles.input}
                  />
                  <button
                    className={styles.saveTagButton}
                    onClick={() => {
                      handleEditTag(tag.id, editTagValue);
                      setEditTagId(null);
                      setEditTagValue('');
                    }}
                  >Salvar</button>
                  <button
                    className={styles.cancelTagButton}
                    onClick={() => {
                      setEditTagId(null);
                      setEditTagValue('');
                    }}
                  >Cancelar</button>
                </>
              ) : (
                <>
                  <span>{tag.name}</span>
                  <button className={styles.editTagButton} onClick={() => { setEditTagId(tag.id); setEditTagValue(tag.name); }}>
                    <FaPencilAlt />
                  </button>
                  <button className={styles.deleteTagButton} onClick={() => handleDeleteTag(tag.id)}>
                    <FaTrash />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    ))}
  </>
);

export default TagsList;
