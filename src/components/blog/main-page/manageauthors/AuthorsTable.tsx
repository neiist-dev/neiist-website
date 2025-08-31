import React, { useState } from 'react';
import styles from '@/styles/components/blog/mainpage/ManageAuthorsModal.module.css';

interface Author {
  id: number;
  name: string;
  email?: string;
  photo?: string;
}

interface AuthorsTableProps {
  authors: Author[];
  editingId: number | null;
  editFields: { name: string; email: string; photo: string };
  confirmDeleteId: number | null;
  handleEdit: (author: Author) => void;
  handleSave: () => void;
  handleCancel: () => void;
  handleDeleteClick: (id: number) => void;
  handleConfirmDelete: () => void;
  handleCancelDelete: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setEditFields: React.Dispatch<React.SetStateAction<{ name: string; email: string; photo: string }>>;
}

const AuthorsTable: React.FC<AuthorsTableProps> = ({ authors, editingId, editFields, confirmDeleteId, handleEdit, handleSave, handleCancel, handleDeleteClick, handleConfirmDelete, handleCancelDelete, handleFileChange, setEditFields }) => {
  const [pendingSaveId, setPendingSaveId] = useState<number | null>(null);

  if (authors.length === 0) {
    return <div className={styles.noAuthors}>Nenhum autor encontrado</div>;
  }

  return (
    <div className={styles.tableContainer}>
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
            <tr key={author.id} className={styles.authorRow}>
              <td>
                {editingId === author.id ? (
                  <label>
                    <img
                      src={editFields.photo || '/default_user.png'}
                      alt="Avatar preview"
                      className={`${styles.avatar} ${styles.avatarEditable}`}
                      style={{ cursor: 'pointer' }}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className={styles.fileInput}
                    />
                  </label>
                ) : (
                  <img
                    src={author.photo || '/default_user.png'}
                    alt={`${author.name} avatar`}
                    className={styles.avatar}
                  />
                )}
              </td>
              <td>
                {editingId === author.id ? (
                  <input
                    type="text"
                    value={editFields.name}
                    onChange={(e) => setEditFields(prev => ({ ...prev, name: e.target.value }))}
                    className={styles.input}
                  />
                ) : (
                  author.name
                )}
              </td>
              <td>
                {editingId === author.id ? (
                  <input
                    type="email"
                    value={editFields.email}
                    onChange={(e) => setEditFields(prev => ({ ...prev, email: e.target.value }))}
                    className={styles.input}
                  />
                ) : (
                  author.email || 'N/A'
                )}
              </td>
              <td>
                {editingId === author.id ? (
                  pendingSaveId === author.id ? (
                    <>
                      <button onClick={() => { handleSave(); setPendingSaveId(null); }} className={styles.editButton}>Confirmar</button>
                      <button onClick={() => { setPendingSaveId(null); }} className={styles.removeButton}>Cancelar</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setPendingSaveId(author.id)} className={styles.editButton}>Guardar</button>
                      <button onClick={handleCancel} className={styles.removeButton}>Cancelar</button>
                    </>
                  )
                ) : confirmDeleteId === author.id ? (
                  <>
                    <button onClick={handleConfirmDelete} className={styles.removeButton}>Confirmar</button>
                    <button onClick={handleCancelDelete} className={styles.editButton}>Cancelar</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEdit(author)} className={styles.editButton}>Editar</button>
                    <button onClick={() => handleDeleteClick(author.id)} className={styles.removeButton}>Eliminar</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AuthorsTable;
