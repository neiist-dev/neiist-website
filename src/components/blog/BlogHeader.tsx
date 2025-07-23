import React from 'react';
import styles from '@/styles/pages/BlogPage.module.css';

const BlogHeader = () => (
  <div className={styles.header}>
    <h1 className={styles.title}>Bem-vindo/a ao Blog do Núcleo!</h1>
    <div className={styles.headerInfo}>
      <span>O teu espaço para te manteres atualizado! Publicamos regularmente as últimas novidades,</span>
      <span> eventos e informações mais importantes para todos os estudantes.</span>
    </div>
  </div>
);

export default BlogHeader;
