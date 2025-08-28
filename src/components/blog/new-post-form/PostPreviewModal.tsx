import React from "react";
import styles from '@/styles/components/blog/newpost-form/PostPreviewModal.module.css';
import PostMeta from '@/components/blog/post/PostMeta';
import PostHeader from '@/components/blog/post/PostHeader';
import PostContent from '@/components/blog/post/PostContent';

interface PostPreviewModalProps {
  title: string;
  previewImage: string | null;
  image: File | string | null;
  selectedAuthors: string[];
  selectedTags: string[];
  description: string;
  onClose: () => void;
}

const PostPreviewModal: React.FC<PostPreviewModalProps> = ({
  title,
  previewImage,
  image,
  selectedAuthors,
  selectedTags,
  description,
  onClose,
}) => {
  return (
    <div className={styles.fixedPreview}>
      <div className={styles.previewOverlay} onClick={onClose}></div>
      <div className={styles.previewContent}>
        <h2 className={styles.previewTitle}>Pré-visualização do Post</h2>
        <div className={styles.previewScroll}>
          <PostMeta authors={selectedAuthors} date={new Date().toISOString()} tags={selectedTags} content={description} />
          <PostHeader title={title} image={previewImage || (typeof image === 'string' ? image : undefined)} />
          <PostContent description={description} />
        </div>
        <button
          className={styles.previewCloseBtn}
          onClick={onClose}
        >
          Fechar
        </button>
      </div>
    </div>
  );
};

export default PostPreviewModal;
