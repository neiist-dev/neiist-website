import React, { useState } from "react";
import styles from "@/styles/components/blog/newpost-form/AddTagModal.module.css";

interface AddTagModalProps {
  onCreate: (tag: string, category: string) => void;
  onClose: () => void;
}

const AddTagModal: React.FC<AddTagModalProps> = ({ onCreate, onClose }) => {
  const [newTag, setNewTag] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState("");

  React.useEffect(() => {
    fetch('/api/blog/tags')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object') {
          setCategories(Object.keys(data));
        }
      });
  }, []);

  const handleCreate = async () => {
    const categoryToUse = newCategory === "__custom__" ? customCategory.trim() : newCategory;
    const tagToUse = newTag.trim();
    if (!tagToUse || !categoryToUse) return;

    if (newCategory === "__custom__" && categories.map(c => c.toLowerCase()).includes(customCategory.trim().toLowerCase())) {
      setError("Essa categoria já existe.");
      return;
    }

    let allTags: string[] = [];
    try {
      const tagsRes = await fetch('/api/blog/tags');
      const tagsData = await tagsRes.json();
      if (tagsData && typeof tagsData === 'object') {
        allTags = Object.values(tagsData).flat().map((tag: any) => tag.name.toLowerCase());
      }
    } catch {}
    if (allTags.includes(tagToUse.toLowerCase())) {
      setError("Essa tag já existe.");
      return;
    }

    try {
      const res = await fetch("/api/blog/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tagToUse, category: categoryToUse })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao criar tag");
        return;
      }
      onCreate(tagToUse, categoryToUse);
      setNewTag("");
      setNewCategory("");
      setCustomCategory("");
      setError("");
    } catch {
      setError("Erro ao criar tag");
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalBackdrop} onClick={() => {
          onClose();
          setNewTag("");
          setNewCategory("");
          setCustomCategory("");
          setError("");
      }}></div>
      <div className={styles.modalContainer}>
        <h2 className={styles.modalTitle}>Adicionar nova tag</h2>
        <label className={styles.label}>Categoria</label>
        <select
          className={styles.select}
          value={newCategory}
          onChange={e => setNewCategory(e.target.value)}
        >
          <option value="">Escolher categoria</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
          <option value="__custom__">Nova categoria...</option>
        </select>
        {newCategory === "__custom__" && (
          <input
            className={styles.input}
            type="text"
            value={customCategory}
            onChange={e => setCustomCategory(e.target.value)}
            placeholder="Nome da nova categoria"
          />
        )}
        <label className={styles.label}>Nome da tag</label>
        <input
          className={styles.input}
          type="text"
          value={newTag}
          onChange={e => setNewTag(e.target.value)}
          placeholder="Nova tag"
        />
        {error && <span className={styles.errorMessage}>{error}</span>}
        <div className={styles.buttonsContainer}>
          <button
            className={styles.createButton}
            onClick={handleCreate}
          >Criar</button>
          <button
            className={styles.cancelButton}
            onClick={() => {
              onClose();
              setNewTag("");
              setNewCategory("");
              setCustomCategory("");
              setError("");
            }}
          >Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default AddTagModal;
