import React from 'react';
import styles from "@styles/components/blog/newpost-form/ContentTextarea.module.css";

interface ContentTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const ContentTextarea: React.FC<ContentTextareaProps> = ({ value, onChange }) => (
  <textarea
    placeholder="Conteúdo..."
    value={value}
    onChange={onChange}
    className={styles.textarea}
  />
);

export default ContentTextarea;

