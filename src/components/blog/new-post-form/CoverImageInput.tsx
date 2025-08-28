import React from 'react';
import { Button } from '@/components/ui/button';
import styles from "@/styles/components/blog/newpost-form/CoverImageInput.module.css";

interface CoverImageInputProps {
  image: File | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onButtonClick: () => void;
}

const CoverImageInput: React.FC<CoverImageInputProps> = ({ image, onChange, onButtonClick }) => (
  <div>
    <label className={styles.label}>Foto de capa</label>
    <div className={styles.inputContainer}>
      <input
        id="file-input"
        type="file"
        accept="image/*"
        onChange={onChange}
        className={styles.hiddenInput}
      />
      <Button
        type="button"
        variant="default"
        onClick={onButtonClick}
        className={styles.button}
      >
        Importar foto
      </Button>
      {image && <span className={styles.fileName}>{image.name}</span>}
    </div>
  </div>
);

export default CoverImageInput;
