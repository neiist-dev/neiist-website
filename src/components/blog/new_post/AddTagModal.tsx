import React, { useState } from "react";

interface AddTagModalProps {
  categories: string[];
  onCreate: (tag: string, category: string) => void;
  onClose: () => void;
}

const AddTagModal: React.FC<AddTagModalProps> = ({ categories, onCreate, onClose }) => {
  const [newTag, setNewTag] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  const [error, setError] = useState("");

  const handleCreate = async () => {
    const categoryToUse = newCategory === "__custom__" ? customCategory : newCategory;
    if (!newTag || !categoryToUse) return;
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTag, category: categoryToUse })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao criar tag");
        return;
      }
      onCreate(newTag, categoryToUse);
      setNewTag("");
      setNewCategory("");
      setCustomCategory("");
      setError("");
    } catch {
      setError("Erro ao criar tag");
    }
  };

  return (
    <div className="fixed inset-0 bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm flex flex-col gap-4">
        <h2 className="text-lg font-bold mb-2">Adicionar nova tag</h2>
        <label className="text-sm">Categoria</label>
        <select
          className="border rounded px-2 py-1 mb-2"
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
            className="border rounded px-2 py-1 mb-2"
            type="text"
            value={customCategory}
            onChange={e => setCustomCategory(e.target.value)}
            placeholder="Nome da nova categoria"
          />
        )}
        <label className="text-sm">Nome da tag</label>
        <input
          className="border rounded px-2 py-1"
          type="text"
          value={newTag}
          onChange={e => setNewTag(e.target.value)}
          placeholder="Nova tag"
        />
        {error && <span className="text-red-500 text-xs">{error}</span>}
        <div className="flex gap-2 mt-2">
          <button
            className="px-4 py-2 rounded bg-primary text-white"
            onClick={handleCreate}
          >Criar</button>
          <button
            className="px-4 py-2 rounded bg-muted text-black"
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
