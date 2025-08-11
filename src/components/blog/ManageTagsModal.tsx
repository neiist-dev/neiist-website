
import React, { useState, useEffect } from "react";

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

  useEffect(() => {
    fetch('/api/tags')
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
    fetch('/api/tags')
      .then(res => res.json())
      .then(data => setTagsByCategory(data));
  };

  // Atualiza lista após eliminar tag
  const handleDeleteTagLocal = async (id: number) => {
    await onDeleteTag(id);
    fetch('/api/tags')
      .then(res => res.json())
      .then(data => setTagsByCategory(data));
  };

  // Atualiza lista após eliminar categoria
  const handleDeleteCategoryLocal = async (category: string) => {
    await onDeleteCategory(category);
    fetch('/api/tags')
      .then(res => res.json())
      .then(data => setTagsByCategory(data));
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
      fetch('/api/tags')
        .then(res => res.json())
        .then(data => setTagsByCategory(data));
    }
  };

  return (
  <div className="flex flex-col gap-4 p-4 w-full max-h-[300vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-gray-800">Gerir Tags</h3>
        <button className="text-gray-500 hover:text-gray-700 cursor-pointer" onClick={onClose}>✕</button>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold mb-1">Nova tag</label>
        <select
          className="border px-2 py-1 rounded w-full mb-1"
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          <option value="">Escolher categoria</option>
          {Object.keys(tagsByCategory).map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
          <option value="__custom__">Nova categoria...</option>
        </select>
        {selectedCategory === "__custom__" && (
          <input
            className="border px-2 py-1 rounded w-full mb-1"
            type="text"
            value={customCategory}
            onChange={e => setCustomCategory(e.target.value)}
            placeholder="Nome da nova categoria"
          />
        )}
        <input
          className="border px-2 py-1 rounded w-full mb-1"
          type="text"
          value={newTag}
          onChange={e => setNewTag(e.target.value)}
          placeholder="Nome da tag"
        />
        <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 w-full text-sm" onClick={handleCreate}>
          Adicionar
        </button>
      </div>
      {error && <span className="text-red-500 text-xs mt-1">{error}</span>}
      <div className="mt-4">
        {Object.entries(tagsByCategory).length === 0 ? (
          <div className="text-gray-400 text-sm">Nenhuma categoria/tag</div>
        ) : (
          Object.entries(tagsByCategory).map(([category, tags]) => (
            <div key={category} className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-700">{category}</span>
                <button className="text-xs text-red-500 hover:underline cursor-pointer" onClick={() => handleDeleteCategoryLocal(category)}>
                  Eliminar categoria
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <div key={tag.id} className="flex items-center bg-white border rounded px-2 py-1">
                    {editingTag && editingTag.id === tag.id ? (
                      <>
                        <input
                          className="border px-1 py-0.5 rounded text-sm mr-2 w-24"
                          value={editingValue}
                          autoFocus
                          onChange={e => setEditingValue(e.target.value)}
                          onBlur={handleUpdateTag}
                        />
                        <button
                          className="text-xs text-blue-600 hover:underline mr-1 cursor-pointer"
                          onMouseDown={e => { e.preventDefault(); handleUpdateTag(); }}
                        >
                          Guardar
                        </button>
                        <button
                          className="text-xs text-gray-400 hover:underline cursor-pointer"
                          onMouseDown={e => { e.preventDefault(); setEditingTag(null); setEditingValue(""); }}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <span
                          className="mr-2 text-gray-800 text-sm cursor-pointer hover:underline"
                          onClick={() => handleEditTag(tag)}
                          title="Editar nome da tag"
                        >
                          {tag.name}
                        </span>
                        <button className="text-md text-red-500 hover:underline cursor-pointer" onClick={() => handleDeleteTagLocal(tag.id)}>
                          x
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
