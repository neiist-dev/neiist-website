import React, { useEffect, useState } from 'react';
import styles from '@/styles/components/blog/mainpage/ManageAuthorsModal.module.css';
import { Button } from '@/components/ui/button';
import AuthorsTable from './AuthorsTable';
import AddAuthorForm from './AddAuthorForm';
import { FaPlus } from 'react-icons/fa';

interface Author {
  id: number;
  name: string;
  email?: string;
  photo?: string;
}

export default function ManageAuthorsModal({ onClose }: { onClose: () => void }) {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFields, setEditFields] = useState<{ name: string; email: string; photo: string }>({ name: '', email: '', photo: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAuthor, setNewAuthor] = useState<{ name: string; email: string; photo: string | null }>({ name: '', email: '', photo: null });
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/blog/authors')
      .then(res => res.json())
      .then(data => setAuthors(Array.isArray(data) ? data : []));
  }, []);

  const handleEdit = (author: Author) => {
    setEditingId(author.id);
    setEditFields({
      name: author.name,
      email: author.email || '',
      photo: author.photo || ''
    });
  };

  const handleSave = async () => {
    if (editingId) {
      await fetch(`/api/blog/authors/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          name: editFields.name,
          email: editFields.email,
          photo: editFields.photo
        })
      });
      setEditingId(null);
      setEditFields({ name: '', email: '', photo: '' });
      setToast({ type: 'success', message: 'Autor atualizado com sucesso!' });
      fetch('/api/blog/authors')
        .then(res => res.json())
        .then(data => setAuthors(Array.isArray(data) ? data : []));
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditFields({ name: '', email: '', photo: '' });
  };

  const handleDeleteClick = (id: number) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (confirmDeleteId) {
      await fetch(`/api/blog/authors/${confirmDeleteId}`, { method: 'DELETE' });
      setConfirmDeleteId(null);
      setToast({ type: 'success', message: 'Autor removido com sucesso!' });
      fetch('/api/blog/authors')
        .then(res => res.json())
        .then(data => setAuthors(Array.isArray(data) ? data : []));
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setEditFields(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setNewAuthor(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAuthor.name.trim()) {
      await fetch('/api/blog/authors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAuthor)
      });
      setShowAddForm(false);
      setNewAuthor({ name: '', email: '', photo: null });
      setToast({ type: 'success', message: 'Autor adicionado com sucesso!' });
      fetch('/api/blog/authors')
        .then(res => res.json())
        .then(data => setAuthors(Array.isArray(data) ? data : []));
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <div className={styles.modal} onClick={handleBackdropClick}>
  <div style={{ position: 'relative' }}>
        <div className={styles.modalHeader}>
          <span>Gerir Autores</span>
          <button onClick={onClose} className={styles.modalHeaderClose}>&times;</button>
        </div>
        <div className={styles.authorListHeader}>
          <h3>Lista de Autores</h3>
          <Button variant="outline" onClick={() => setShowAddForm(true)} className={styles.addAuthorButton}>
            <FaPlus></FaPlus>Adicionar Autor
          </Button>
        </div>
        <div className={styles.authorList}>
          <AuthorsTable
            authors={authors}
            editingId={editingId}
            editFields={editFields}
            confirmDeleteId={confirmDeleteId}
            handleEdit={handleEdit}
            handleSave={handleSave}
            handleCancel={handleCancel}
            handleDeleteClick={handleDeleteClick}
            handleConfirmDelete={handleConfirmDelete}
            handleCancelDelete={handleCancelDelete}
            handleFileChange={handleFileChange}
            setEditFields={setEditFields}
          />
          {showAddForm && (
            <AddAuthorForm
              newAuthor={newAuthor}
              setNewAuthor={setNewAuthor}
              handleAddFileChange={handleAddFileChange}
              handleAddAuthor={handleAddAuthor}
              error={error}
              onCancel={() => setShowAddForm(false)}
            />
          )}
        </div>
        {toast && (
          <div className={`${styles.toast} ${styles[toast.type]}`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className={styles.toastClose}>×</button>
          </div>
        )}
      </div>
    </div>
  );
}
