import React from "react";
import styles from '@/styles/components/blog/post/PostPage.module.css';

interface PostToastProps {
  type: 'success' | 'error';
  message: string;
}

const PostToast: React.FC<PostToastProps> = ({ type, message }) => {
  return (
    <div className={
      `${styles.toast} ${type === 'success' ? styles.toastSuccess : styles.toastError}`
    }>
      {message}
    </div>
  );
};

export default PostToast;
