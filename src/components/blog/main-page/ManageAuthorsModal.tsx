import React, { useEffect, useState } from 'react';
import AddAuthorModal from '../new-post-form/AddAuthorModal';
import styles from '@/styles/components/blog/mainpage/ManageAuthorsModal.module.css';
import { Button } from '@/components/ui/button';


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
    <div className={styles.modal}>
      <div className={styles.modalHeader}>
        Gerir Autores
  <button onClick={onClose} className={styles.closeButton}>&times;</button>
      </div>
      <div className={styles.modalActions}>
        <Button variant="outline" onClick={() => setShowAddModal(true)}>Adicionar Autor</Button>
      </div>
      <div>
        <h3>Lista de Autores</h3>
        <div className={styles.authorList}>
          {authors.map(author => (
            <div key={author.id} className={styles.authorItem}>
              <span>{author.name}</span>
              <div>
                <button onClick={() => handleEdit(author.id)} className={styles.editButton}>Editar</button>
                <button onClick={() => handleDelete(author.id)} className={styles.removeButton}>Remover</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.modalActions}>
        <Button variant="outline" onClick={onClose}>Fechar</Button>
      </div>
      {showAddModal && <AddAuthorModal onCreate={handleAddAuthor} onClose={() => setShowAddModal(false)} />}
    </div>

  );
};

export default ManageAuthorsModal;

