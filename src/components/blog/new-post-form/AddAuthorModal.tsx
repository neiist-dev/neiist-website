import React, { useState, useRef } from "react";
import { FaImage } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import styles from "@/styles/components/blog/newpost-form/AddAuthorModal.module.css";

interface AddAuthorModalProps {
  onCreate: (author: { name: string; email: string; photo: string | null }) => void;
  onClose: () => void;
}

const AddAuthorModal: React.FC<AddAuthorModalProps> = ({ onCreate, onClose }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    if (!name.trim() || !email.trim()) {
      setError("Preenche todos os campos obrigatórios.");
      return;
    }
    let photoBase64: string | null = null;
    if (photo) {
      photoBase64 = await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(photo);
      });
    }
    onCreate({ name: name.trim(), email: email.trim(), photo: photoBase64 });
    setName("");
    setEmail("");
    setPhoto(null);
    setError("");
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalBackdrop} onClick={onClose}></div>
      <div className={styles.modalContainer}>
        <h2 className={styles.modalTitle}>Adicionar Autor</h2>
        <div className={styles.formContainer}>
          <label className={styles.label}>Nome</label>
          <input
            type="text"
            placeholder="Nome"
            className={styles.input}
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <label className={styles.label}>Email</label>
          <input
            type="email"
            placeholder="Email"
            className={styles.input}
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <label className={styles.label}>Foto</label>
          <div className={styles.photoContainer}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={styles.photoButton}
              onClick={() => fileInputRef.current?.click()}
            >
              <FaImage className={styles.photoIcon} />
              {photo ? "Alterar foto" : "Importar foto"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenInput}
              onChange={e => {
                const file = e.target.files ? e.target.files[0] : null;
                setPhoto(file);
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setPhotoPreview(reader.result as string);
                  reader.readAsDataURL(file);
                } else {
                  setPhotoPreview(null);
                }
              }}
            />
          </div>
          {photoPreview && (
            <div className={styles.previewContainer}>
              <span className={styles.previewLabel}>Pré-visualização:</span>
              <img src={photoPreview} alt="Preview" className={styles.previewImage} />
            </div>
          )}
          {error && <div className={styles.errorMessage}>{error}</div>}
          <div className={styles.buttonsContainer}>
            <Button variant="outline" className={styles.button} onClick={onClose}>Cancelar</Button>
            <Button variant="default" className={`${styles.button} ${styles.addButton}`} onClick={handleCreate}>Adicionar</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAuthorModal;
