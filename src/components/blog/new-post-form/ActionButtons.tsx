import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import styles from "@/styles/components/blog/newpost-form/ActionButtons.module.css";

interface ActionButtonsProps {
  onSave: () => void;
  onUpdate?: () => void;
  saving: boolean;
  editMode?: boolean;
  onPreview?: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onSave, onUpdate, saving, editMode, onPreview }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState<'save' | 'update' | null>(null);

  const handleClick = (type: 'save' | 'update') => {
    setActionType(type);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    if (actionType === 'save') onSave();
    if (actionType === 'update' && onUpdate) onUpdate();
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setActionType(null);
  };

  return (
    <div className={styles.container}>
      <Button variant="outline" className={styles.button} onClick={onPreview}>
        Pré-visualizar
      </Button>
      {editMode ? (
        <Button onClick={() => handleClick('update')} disabled={saving} className={styles.button}>
          {saving ? 'A atualizar...' : 'Atualizar'}
        </Button>
      ) : (
        <Button onClick={() => handleClick('save')} disabled={saving} className={styles.button}>
          {saving ? 'A publicar...' : 'Publicar'}
        </Button>
      )}

      {showConfirm && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmBackdrop}></div>
          <div className={styles.confirmWrapper}>
            <div className={styles.confirmBox}>
              <span className={styles.confirmText}>
                {actionType === 'save' ? 'Confirmar publicação?' : 'Confirmar atualização?'}
              </span>
              <div className={styles.confirmActions}>
                <Button variant="outline" onClick={handleCancel} className={styles.confirmBtn}>Cancelar</Button>
                <Button onClick={handleConfirm} className={styles.confirmBtn} autoFocus>Confirmar</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionButtons;
