import React from "react";
import styles from '@/styles/components/blog/post/PostPage.module.css';
import { Button } from "@/components/ui/button";

interface PostDeleteDialogProps {
  open: boolean;
  onCancel: () => void;
  onDelete: () => void;
  deleting: boolean;
}

const PostDeleteDialog: React.FC<PostDeleteDialogProps> = ({ open, onCancel, onDelete, deleting }) => {
  if (!open) return null;
  return (
    <div className={styles.fixedPreview}>
      <div className={styles.deleteDialogOverlay}></div>
      <div className={styles.deleteDialog}>
        <span className={styles.deleteDialogText}>Tens a certeza que queres apagar este post?</span>
        <div className={styles.deleteDialogActions}>
          <Button variant="outline" onClick={onCancel} className={styles.cancelButton}>Cancelar</Button>
          <Button onClick={onDelete} className={styles.confirmDeleteButton} disabled={deleting}>
            {deleting ? 'A apagar...' : 'Apagar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PostDeleteDialog;
