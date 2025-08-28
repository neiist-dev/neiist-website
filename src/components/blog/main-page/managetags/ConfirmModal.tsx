import React from 'react';
import styles from '@/styles/components/blog/mainpage/ManageTagsModal.module.css';

interface ConfirmModalProps {
  open: boolean;
  type: 'category' | 'tag';
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ open, type, name, onCancel, onConfirm }) => {
  if (!open) return null;
  return (
    <div
      className={styles.confirmOverlay}
      onClick={e => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className={styles.confirmModal}>
        <p>
          Tens a certeza que queres eliminar {type === 'category' ? 'a categoria' : 'a tag'} <b>{name}</b>?
        </p>
        <div className={styles.buttonRow}>
          <button className={styles.cancelButton} onClick={onCancel}>Cancelar</button>
          <button className={styles.removeButton} onClick={onConfirm}>Confirmar</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
