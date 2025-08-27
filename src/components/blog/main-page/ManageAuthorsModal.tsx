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
  const [confirmEditId, setConfirmEditId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [editFields, setEditFields] = useState<{ name: string; email: string; photo: string | null } | null>(null);

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

  const handleEdit = (id: number) => {
    const author = authors.find(a => a.id === id);
    if (author) {
      setEditingId(id);
      setEditFields({
        name: author.name,
        email: author.email || '',
        photo: author.photo || null
      });
    }
  };

  const handleFieldChange = (field: keyof Author, value: string | null) => {
    if (editFields) {
      setEditFields({ ...editFields, [field]: value });
    }
  };

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
    if (!editFields) return;
    const updatedAuthor = {
      ...author,
      name: editFields.name,
      email: editFields.email,
      photo: editFields.photo
    };
    if (confirmEditId === author.id) {
      const res = await fetch(`/api/blog/authors/${author.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAuthor)
      });
      if (res.ok) {
        fetchAuthors();
        setEditingId(null);
        setEditFields(null);
        setConfirmEditId(null);
        setToast({ type: 'success', message: 'Autor atualizado com sucesso!' });
      } else {
        setError('Erro ao atualizar autor');
      }
    } else {
      setConfirmEditId(author.id);
      setTimeout(() => setConfirmEditId(null), 3000);
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
    <div className={styles.modal} onClick={handleBackdropClick}>
      <div>
        <div className={styles.modalHeader}>
          Gerir Autores
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>
        <div className={styles.authorListHeader}>
          <h3>Lista de Autores</h3>
          <Button variant="outline" onClick={() => setShowAddModal(true)} className={styles.addAuthorButton}>
            Adicionar Autor
          </Button>
        </div>
        <div className={styles.authorList}>
          <table className={styles.authorTable}>
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Nome</th>
                <th>Email</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {authors.map(author => (
                <tr key={author.id}>
                  <td>
                    {editingId === author.id ? (
                      <div className={styles.avatarEditCell}>
                        <label htmlFor={`avatar-upload-${author.id}`} className={styles.avatarEditButton}>
                          <img
                            src={editFields?.photo || author.photo || undefined}
                            alt={author.name}
                            className={styles.avatar}
                          />
                          <input
                            id={`avatar-upload-${author.id}`}
                            type="file"
                            accept="image/*"
                            className={styles.fileInput}
                            onChange={e => {
                              const file = e.target.files ? e.target.files[0] : null;
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  handleFieldChange('photo', reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              } else {
                                handleFieldChange('photo', null);
                              }
                            }}
                          />
                        </label>
                      </div>
                    ) : author.photo ? (
                      <img
                        src={author.photo}
                        alt={author.name}
                        className={styles.avatar}
                      />
                    ) : (
                      <div className={styles.avatar + ' ' + styles.avatarPlaceholder}>
                        <span className={styles.avatarIcon}>?</span>
                      </div>
                    )}
                  </td>
                  <td className={styles.name}>
                    {editingId === author.id ? (
                      <input
                        type="text"
                        value={editFields?.name || ''}
                        onChange={e => handleFieldChange('name', e.target.value)}
                        className={styles.input}
                        placeholder="Nome"
                      />
                    ) : author.name}
                  </td>
                  <td className={styles.email}>
                    {editingId === author.id ? (
                      <input
                        type="email"
                        value={editFields?.email || ''}
                        onChange={e => handleFieldChange('email', e.target.value)}
                        className={styles.input}
                        placeholder="Email"
                      />
                    ) : (author.email || 'Sem email')}
                  </td>
                  <td>
                    {editingId === author.id ? (
                      <>
                        <button onClick={() => handleSave(author)} className={styles.editButton}>
                          {confirmEditId === author.id ? 'Confirmar' : 'Guardar'}
                        </button>
                        <button onClick={() => { setEditingId(null); setEditFields(null); setConfirmEditId(null); fetchAuthors(); }} className={styles.removeButton}>
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(author.id)} className={styles.editButton}>
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDelete(author.id)} 
                          className={styles.removeButton}
                        >
                          {confirmDeleteId === author.id ? 'Confirmar' : 'Remover'}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showAddModal && <AddAuthorModal onCreate={handleAddAuthor} onClose={() => setShowAddModal(false)} />}
    </div>
  );
};

export default ManageAuthorsModal;

