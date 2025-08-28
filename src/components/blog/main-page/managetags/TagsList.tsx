import React from 'react';
import { FaPencilAlt, FaTrash } from 'react-icons/fa';
import styles from '@/styles/components/blog/mainpage/ManageTagsModal.module.css';
import ConfirmModal from './ConfirmModal';

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


const TagsList: React.FC<TagsListProps> = ({ tagsByCategory, editTagId, editTagValue, setEditTagId, setEditTagValue, handleEditTag, handleDeleteTag, handleDeleteCategory }) => {
  const [pendingSaveId, setPendingSaveId] = React.useState<number | null>(null);

  const [confirmCategory, setConfirmCategory] = React.useState<string | null>(null);
  const [confirmTagId, setConfirmTagId] = React.useState<number | null>(null);

  return (
    <>
      {Object.entries(tagsByCategory).map(([category, tags]) => (
        <div key={category} className={styles.categoryBlock}>
          <div className={styles.categoryLabel}>
            {category}
            <button className={styles.deleteCategoryButton} onClick={() => setConfirmCategory(category)}>
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
                      className={styles.editButton}
                      onClick={() => {
                        if (pendingSaveId === tag.id) {
                          handleEditTag(tag.id, editTagValue);
                          setEditTagId(null);
                          setEditTagValue('');
                          setPendingSaveId(null);
                        } else {
                          setPendingSaveId(tag.id);
                        }
                      }}
                    >{pendingSaveId === tag.id ? 'Confirmar' : 'Guardar'}</button>
                    <button
                      className={styles.cancelButton}
                      onClick={() => {
                        setEditTagId(null);
                        setEditTagValue('');
                        setPendingSaveId(null);
                      }}
                    >Cancelar</button>
                  </>
                ) : (
                  <>
                    <span>{tag.name}</span>
                    <button className={styles.editButton} onClick={() => { setEditTagId(tag.id); setEditTagValue(tag.name); setPendingSaveId(null); }}>
                      <FaPencilAlt />
                    </button>
                    <button className={styles.removeButton} onClick={() => setConfirmTagId(tag.id)}>
                      <FaTrash />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <ConfirmModal
        open={!!confirmCategory}
        type="category"
        name={confirmCategory || ''}
        onCancel={() => setConfirmCategory(null)}
        onConfirm={() => { if (confirmCategory) { handleDeleteCategory(confirmCategory); setConfirmCategory(null); } }}
      />
      <ConfirmModal
        open={confirmTagId !== null}
        type="tag"
        name={(() => {
          let tagName = '';
          Object.values(tagsByCategory).forEach(tags => {
            tags.forEach(tag => {
              if (tag.id === confirmTagId) tagName = tag.name;
            });
          });
          return tagName;
        })()}
        onCancel={() => setConfirmTagId(null)}
        onConfirm={() => { if (confirmTagId !== null) { handleDeleteTag(confirmTagId); setConfirmTagId(null); } }}
      />
    </>
  );
};

export default TagsList;
