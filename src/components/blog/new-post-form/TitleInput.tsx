import React from 'react';
import { Input } from '@/components/ui/input';
import styles from "@/styles/components/blog/newpost-form/TitleInput.module.css";

interface TitleInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const TitleInput: React.FC<TitleInputProps> = ({ value, onChange }) => (
  <div className={styles.container}>
    <label className={styles.label}>Título</label>
    <Input
      type="text"
      placeholder="Insere aqui o título da notícia"
      value={value}
      onChange={onChange}
      className={styles.input}
    />
  </div>
);

export default TitleInput;
