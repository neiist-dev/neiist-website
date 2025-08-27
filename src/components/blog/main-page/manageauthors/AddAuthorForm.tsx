
import React, { useRef } from "react";
import { FaImage } from "react-icons/fa";
import styles from '@/styles/components/blog/mainpage/ManageAuthorsModal.module.css';
import { Button } from '@/components/ui/button';

interface AddAuthorFormProps {
  newAuthor: { name: string; email: string; photo: string | null };
  setNewAuthor: React.Dispatch<React.SetStateAction<{ name: string; email: string; photo: string | null }>>;
  handleAddFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddAuthor: (e: React.FormEvent) => Promise<void>;
  error: string | null;
  onCancel: () => void;
}

const AddAuthorForm: React.FC<AddAuthorFormProps> = ({ newAuthor, setNewAuthor, handleAddFileChange, handleAddAuthor, error, onCancel }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAuthor.name.trim()) {
      handleAddAuthor(e);
      setNewAuthor({ name: '', email: '', photo: null });
    }
  };

  return (
    <div className={styles.addFormOverlay} onClick={handleBackdropClick}>
      <div className={styles.addFormContainer}>
        <h3 className={styles.addFormTitle}>Adicionar Autor</h3>
        <button onClick={onCancel} className={styles.closeButton}>&times;</button>
        <form onSubmit={handleSubmit} className={styles.addFormFields}>
          <label className={styles.addFormLabel}>Nome</label>
          <input
            type="text"
            placeholder="Nome"
            className={styles.input}
            value={newAuthor.name}
            onChange={e => setNewAuthor(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          <label className={styles.addFormLabel}>Email</label>
          <input
            type="email"
            placeholder="Email"
            className={styles.input}
            value={newAuthor.email}
            onChange={e => setNewAuthor(prev => ({ ...prev, email: e.target.value }))}
          />
          <label className={styles.addFormLabel}>Foto</label>
          <div className={styles.addFormPhotoRow}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={styles.addFormPhotoButton}
              onClick={() => fileInputRef.current?.click()}
            >
              <FaImage className={styles.addFormPhotoIcon} />
              {newAuthor.photo ? "Alterar foto" : "Importar foto"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={handleAddFileChange}
            />
          </div>
          {newAuthor.photo && (
            <div className={styles.addFormPhotoPreview}>
              <span className={styles.addFormPhotoPreviewLabel}>Pré-visualização:</span>
              <img src={newAuthor.photo} alt="Preview" className={styles.addFormPhotoPreviewImg} />
            </div>
          )}
          {error && <div className={styles.addFormError}>{error}</div>}
          <div className={styles.addFormActions}>
            <Button variant="outline" className={styles.addFormCancelButton} type="button" onClick={onCancel}>Cancelar</Button>
            <Button variant="default" className={styles.addFormSubmitButton} type="submit">Adicionar</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAuthorForm;
