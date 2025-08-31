import React, { useState, useEffect } from 'react';
import TagsForm from './TagsForm';
import TagsList from './TagsList';
import styles from '@/styles/components/blog/mainpage/ManageTagsModal.module.css';

interface Tag {
  id: number;
  name: string;
}

interface TagsByCategory {
  [category: string]: Tag[];
}

const ManageTagsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [tagsByCategory, setTagsByCategory] = useState<TagsByCategory>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleDeleteTag = async (id: number) => {
    await fetch(`/api/blog/tags/${id}`, {
      method: 'DELETE',
    });
    setToast({ type: 'success', message: 'Tag removida com sucesso!' });
    const res = await fetch('/api/blog/tags');
    const data = await res.json();
    setTagsByCategory(data);
  };

  const handleDeleteCategory = async (category: string) => {
    await fetch(`/api/blog/tags/category/${encodeURIComponent(category)}`, {
      method: 'DELETE',
    });
    setToast({ type: 'success', message: 'Categoria removida com sucesso!' });
    const res = await fetch('/api/blog/tags');
    const data = await res.json();
    setTagsByCategory(data);
  };

  const handleEditTag = async (id: number, newName: string) => {
    await fetch(`/api/blog/tags/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    });
    setToast({ type: 'success', message: 'Tag atualizada com sucesso!' });
    const res = await fetch('/api/blog/tags');
    const data = await res.json();
    setTagsByCategory(data);
  };

  const handleCreateTag = async (category: string, name: string) => {
    await fetch('/api/blog/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, name }),
    });
    setToast({ type: 'success', message: 'Tag criada com sucesso!' });
    const res = await fetch('/api/blog/tags');
    const data = await res.json();
    setTagsByCategory(data);
  };

  const [editTagId, setEditTagId] = useState<number | null>(null);
  const [editTagValue, setEditTagValue] = useState('');
  const [newTagCategory, setNewTagCategory] = useState('');
  const [newTagName, setNewTagName] = useState('');

  return (
    <div
      className={styles.modalOverlay}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <span>Gerir Tags</span>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>
        <div className={styles.modalContent}>
          {loading ? (
            <div className={styles.loading}>A carregar...</div>
          ) : (
            <>
              <TagsForm
                tagsByCategory={tagsByCategory}
                newTagCategory={newTagCategory}
                setNewTagCategory={setNewTagCategory}
                newTagName={newTagName}
                setNewTagName={setNewTagName}
                handleCreateTag={handleCreateTag}
              />
              <TagsList
                tagsByCategory={tagsByCategory}
                editTagId={editTagId}
                editTagValue={editTagValue}
                setEditTagId={setEditTagId}
                setEditTagValue={setEditTagValue}
                handleEditTag={handleEditTag}
                handleDeleteTag={handleDeleteTag}
                handleDeleteCategory={handleDeleteCategory}
              />
            </>
          )}
        </div>
        {toast && (
          <div className={`${styles.toast} ${styles[toast.type]}`}> 
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className={styles.toastClose}>x</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageTagsModal;
