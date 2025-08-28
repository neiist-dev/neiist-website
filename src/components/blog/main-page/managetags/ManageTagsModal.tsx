import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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

  const handleDeleteTag = async (id: number) => {
    await fetch(`/api/blog/tags/${id}`, {
      method: 'DELETE',
    });
    const res = await fetch('/api/blog/tags');
    const data = await res.json();
    setTagsByCategory(data);
  };

  const handleDeleteCategory = async (category: string) => {
    await fetch(`/api/blog/tags/category/${encodeURIComponent(category)}`, {
      method: 'DELETE',
    });
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
    const res = await fetch('/api/blog/tags');
    const data = await res.json();
    setTagsByCategory(data);
  };

  const [editTagId, setEditTagId] = useState<number | null>(null);
  const [editTagValue, setEditTagValue] = useState('');
  const [newTagCategory, setNewTagCategory] = useState('');
  const [newTagName, setNewTagName] = useState('');

  return (
    <div className={styles.modalOverlay}>
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
      </div>
    </div>
  );
};

export default ManageTagsModal;
