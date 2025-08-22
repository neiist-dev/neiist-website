import React, { useEffect, useState } from 'react';
import AddAuthorModal from '../new-post-form/AddAuthorModal';

interface Author {
  id: number;
  name: string;
  email?: string;
  photo?: string;
}

interface ManageAuthorsModalProps {
  onClose: () => void;
}

const ManageAuthorsModal: React.FC<ManageAuthorsModalProps> = ({ onClose }) => {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmSaveId, setConfirmSaveId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAuthors = () => {
    fetch('/api/blog/authors')
      .then(res => res.json())
      .then(data => {
        setAuthors(Array.isArray(data) ? data.map((a: any) => ({
          id: a.id,
          name: a.name,
          email: a.email || '',
          photo: a.photo || ''
        })) : []);
      });
  };
  useEffect(() => {
    fetchAuthors();
  }, []);

  const handleEdit = (id: number) => setEditingId(id);
  const handleDelete = async (id: number) => {
    if (confirmDeleteId === id) {
      await fetch(`/api/blog/authors/${id}`, { method: 'DELETE' });
      setAuthors(authors.filter(a => a.id !== id));
      setToast({ type: 'success', message: 'Autor removido com sucesso!' });
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };
  const handleSave = async (author: Author) => {
    if (confirmSaveId === author.id) {
      const res = await fetch(`/api/blog/authors/${author.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(author)
      });
      if (res.ok) {
        setAuthors(authors.map(a => (a.id === author.id ? author : a)));
        setEditingId(null);
        setToast({ type: 'success', message: 'Autor atualizado com sucesso!' });
      } else {
        setError('Erro ao atualizar autor');
      }
      setConfirmSaveId(null);
    } else {
      setConfirmSaveId(author.id);
      setTimeout(() => setConfirmSaveId(null), 3000);
    }
  };

  const handleAddAuthor = async (author: { name: string; email: string; photo: string | null }) => {
    const res = await fetch('/api/blog/authors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(author)
    });
    if (res.ok) {
      fetchAuthors();
      setShowAddModal(false);
      setError(null);
      setToast({ type: 'success', message: 'Autor adicionado com sucesso!' });
    } else {
      setError('Erro ao adicionar autor');
    }
  };

  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleBackdropClick}>
      {toast && (
        <div className={`fixed top-6 right-4 z-[100] px-3 py-1.5 rounded shadow-md text-white font-semibold text-sm transition-all ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} style={{ minWidth: 180, maxWidth: 260 }}>
          {toast.message}
        </div>
      )}
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 gap-2">
          <h2 className="text-xl font-bold">Gerir Autores</h2>
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer mr-2"
              onClick={() => setShowAddModal(true)}
            >
              Adicionar novo autor
            </button>
            <button className="text-gray-500 hover:text-gray-700 cursor-pointer text-xl px-2" onClick={onClose} title="Fechar">✕</button>
          </div>
        </div>
        {error && <div className="mb-2 text-red-500">{error}</div>}
        <div className="w-full overflow-x-auto mb-4">
          <table className="w-full min-w-[600px] border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Nome</th>
                <th className="p-2 border">Email</th>
                <th className="p-2 border">Foto</th>
                <th className="p-2 border">Ações</th>
              </tr>
            </thead>
            <tbody>
              {authors.map(author => (
                <tr key={author.id}>
                  <td className="p-2 border">
                    {editingId === author.id ? (
                      <input value={author.name} onChange={e => setAuthors(authors.map(a => a.id === author.id ? { ...a, name: e.target.value } : a))} className="border px-2 py-1 rounded w-full" />
                    ) : author.name}
                  </td>
                  <td className="p-2 border">
                    {editingId === author.id ? (
                      <input value={author.email || ''} onChange={e => setAuthors(authors.map(a => a.id === author.id ? { ...a, email: e.target.value } : a))} className="border px-2 py-1 rounded w-full" />
                    ) : author.email}
                  </td>
                  <td className="p-2 border">
                    {editingId === author.id ? (
                      <div className="flex flex-col items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          className="w-full"
                          onChange={e => {
                            const file = e.target.files ? e.target.files[0] : null;
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setAuthors(authors.map(a => a.id === author.id ? { ...a, photo: reader.result as string } : a));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        {author.photo ? (
                          <img src={author.photo} alt={author.name} className="w-10 h-10 rounded-full object-cover mx-auto" />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    ) : (
                      author.photo ? <img src={author.photo} alt={author.name} className="w-10 h-10 rounded-full object-cover mx-auto" /> : <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="p-2 border">
                    <div className="flex flex-row items-center justify-center gap-2 min-w-[120px]">
                      {editingId === author.id ? (
                        <>
                          <button className="text-green-600 px-2 py-1 rounded hover:bg-green-100 cursor-pointer whitespace-nowrap" onClick={() => handleSave(author)}>
                            {confirmSaveId === author.id ? 'Confirmar' : 'Guardar'}
                          </button>
                          <button className="text-gray-500 px-2 py-1 rounded hover:bg-gray-200 cursor-pointer whitespace-nowrap" onClick={() => setEditingId(null)}>Cancelar</button>
                        </>
                      ) : (
                        <>
                          <button className="text-blue-600 px-2 py-1 rounded hover:bg-blue-100 cursor-pointer whitespace-nowrap" onClick={() => handleEdit(author.id)}>Editar</button>
                          <button className="text-red-600 px-2 py-1 rounded hover:bg-red-100 cursor-pointer whitespace-nowrap" onClick={() => handleDelete(author.id)}>
                            {confirmDeleteId === author.id ? 'Confirmar' : 'Remover'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {showAddModal && (
          <AddAuthorModal onCreate={handleAddAuthor} onClose={() => setShowAddModal(false)} />
        )}
      </div>
    </div>
  );
};

export default ManageAuthorsModal;
