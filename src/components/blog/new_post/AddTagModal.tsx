import React, { useState } from "react";

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
    fetch('/api/tags')
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
      const tagsRes = await fetch('/api/tags');
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
      const res = await fetch("/api/tags", {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 transition-opacity backdrop-blur-sm"></div>
      <div className="relative bg-white rounded-xl shadow-2xl p-7 w-full max-w-sm flex flex-col gap-4 items-center animate-fadeIn">
        <h2 className="text-xl font-bold mb-3 text-gray-800">Adicionar nova tag</h2>
        <label className="text-sm self-start mb-1">Categoria</label>
        <select
          className="border border-gray-300 rounded px-3 py-2 mb-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
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
            className="border border-gray-300 rounded px-3 py-2 mb-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            type="text"
            value={customCategory}
            onChange={e => setCustomCategory(e.target.value)}
            placeholder="Nome da nova categoria"
          />
        )}
        <label className="text-sm self-start mb-1">Nome da tag</label>
        <input
          className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          type="text"
          value={newTag}
          onChange={e => setNewTag(e.target.value)}
          placeholder="Nova tag"
        />
        {error && <span className="text-red-500 text-xs self-start mt-1">{error}</span>}
        <div className="flex gap-3 mt-4 w-full justify-end">
          <button
            className="px-5 py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors cursor-pointer"
            onClick={handleCreate}
          >Criar</button>
          <button
            className="px-5 py-2 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors cursor-pointer"
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
