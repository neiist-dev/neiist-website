import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import styles from '@/styles/components/blog/mainpage/ManageTagsModal.module.css';

export interface ManageTagsModalProps {
  tagsByCategory: Record<string, { id: number; name: string }[]>;
  onCreate: (tag: string, category: string) => Promise<void> | void;
  onDeleteTag: (id: number) => Promise<void> | void;
  onDeleteCategory: (category: string) => Promise<void> | void;
  onUpdateTag: (id: number, name: string) => Promise<void> | void;
  onClose: () => void;
}

const ManageTagsModal: React.FC<ManageTagsModalProps> = ({
  tagsByCategory: initialTagsByCategory,
  onCreate,
  onDeleteTag,
  onDeleteCategory,
  onUpdateTag,
  onClose,
}) => {
  const [tagsByCategory, setTagsByCategory] = useState(initialTagsByCategory);
  const [newTag, setNewTag] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [error, setError] = useState("");
  const [editingTag, setEditingTag] = useState<{ id: number; name: string } | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDeleteTag, setConfirmDeleteTag] = useState<number | null>(null);
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/blog/tags')
      .then(res => res.json())
      .then(data => setTagsByCategory(data));
  }, []);

  const handleCreate = async () => {
    let categoryToUse = selectedCategory;
    if (selectedCategory === "__custom__") {
      if (!customCategory.trim()) {
        setError("Preenche o nome da nova categoria.");
        return;
      }
      categoryToUse = customCategory.trim();
    }
    if (!newTag.trim() || !categoryToUse) {
      setError("Preenche todos os campos.");
      return;
    }
    await onCreate(newTag.trim(), categoryToUse);
    setNewTag("");
    setSelectedCategory("");
    setCustomCategory("");
    setError("");
    fetch('/api/blog/tags')
      .then(res => res.json())
      .then(data => setTagsByCategory(data));
  };

  // Atualiza lista após eliminar tag
  const handleDeleteTagLocal = async (id: number) => {
    if (confirmDeleteTag === id) {
      await onDeleteTag(id);
      setToast({ type: 'success', message: 'Tag eliminada com sucesso!' });
      setConfirmDeleteTag(null);
      fetch('/api/blog/tags')
        .then(res => res.json())
        .then(data => setTagsByCategory(data));
    } else {
      setConfirmDeleteTag(id);
      setTimeout(() => setConfirmDeleteTag(null), 3000);
    }
  };

  // Atualiza lista após eliminar categoria
  const handleDeleteCategoryLocal = async (category: string) => {
    if (confirmDeleteCategory === category) {
      await onDeleteCategory(category);
      setToast({ type: 'success', message: 'Categoria eliminada com sucesso!' });
      setConfirmDeleteCategory(null);
      fetch('/api/blog/tags')
        .then(res => res.json())
        .then(data => setTagsByCategory(data));
    } else {
      setConfirmDeleteCategory(category);
      setTimeout(() => setConfirmDeleteCategory(null), 3000);
    }
  };

  const handleEditTag = (tag: { id: number; name: string }) => {
    setEditingTag(tag);
    setEditingValue(tag.name);
  };

  const handleUpdateTag = async () => {
    if (editingTag && editingValue.trim()) {
      await onUpdateTag(editingTag.id, editingValue.trim());
      setEditingTag(null);
      setEditingValue("");
      setToast({ type: 'success', message: 'Tag atualizada com sucesso!' });
      fetch('/api/blog/tags')
        .then(res => res.json())
        .then(data => setTagsByCategory(data));
    }
  };

  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
  <div className={styles.modal}>
    {toast && (
  <div className={toast.type === 'success' ? styles.toastSuccess : styles.toastError}>
        {toast.message}
      </div>
    )}
    <div className={styles.modalHeader}>
      <h3>Gerir Tags</h3>
  <button onClick={onClose} className={styles.closeButton}>✕</button>
    </div>
    <div>
      <label>Nova tag</label>
      <select
        value={selectedCategory}
        onChange={e => setSelectedCategory(e.target.value)}
  className={styles.selectInput}
      >
        <option value="">Escolher categoria</option>
        {Object.keys(tagsByCategory).map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
        <option value="__custom__">Nova categoria...</option>
      </select>
      {selectedCategory === "__custom__" && (
        <input
          type="text"
          value={customCategory}
          onChange={e => setCustomCategory(e.target.value)}
          placeholder="Nome da nova categoria"
          className={styles.textInput}
        />
      )}
      <input
        type="text"
        value={newTag}
        onChange={e => setNewTag(e.target.value)}
        placeholder="Nome da tag"
        className={styles.textInput}
      />
  <Button variant="outline" onClick={handleCreate} className={styles.addButton}>Adicionar</Button>
    </div>
  {error && <span className={styles.error}>{error}</span>}
    <div className={styles.tagList}>
      {Object.entries(tagsByCategory).length === 0 ? (
  <div className={styles.noCategory}>Nenhuma categoria/tag</div>
      ) : (
        Object.entries(tagsByCategory).map(([category, tags]) => (
          <div key={category} className={styles.categoryBlock}>
            <div className={styles.categoryHeader}>
              <span className={styles.categoryTitle}>{category}</span>
              <button onClick={() => handleDeleteCategoryLocal(category)} className={styles.deleteCategoryButton}>
                {confirmDeleteCategory === category ? 'Confirmar eliminar' : 'Eliminar categoria'}
              </button>
            </div>
            <div className={styles.tagWrap}>
              {tags.map(tag => (
                <div key={tag.id} className={styles.tagItem}>
                  {editingTag && editingTag.id === tag.id ? (
                    <>
                      <input
                        value={editingValue}
                        autoFocus
                        onChange={e => setEditingValue(e.target.value)}
                        onBlur={handleUpdateTag}
                        className={styles.editTagInput}
                      />
                      <button
                        className={styles.saveTagButton}
                        onMouseDown={e => { e.preventDefault(); handleUpdateTag(); }}
                      >
                        Guardar
                      </button>
                      <button
                        className={styles.cancelTagButton}
                        onMouseDown={e => { e.preventDefault(); setEditingTag(null); setEditingValue(""); }}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        className={styles.tagName}
                        onClick={() => handleEditTag(tag)}
                        title="Editar nome da tag"
                      >
                        {tag.name}
                      </span>
                      <button onClick={() => handleDeleteTagLocal(tag.id)} className={styles.deleteTagButton}>
                        {confirmDeleteTag === tag.id ? 'Confirmar' : 'x'}
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  </div>
  );
};

export default ManageTagsModal;
