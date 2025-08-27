import React from 'react';
import styles from '@/styles/components/blog/mainpage/BlogHeader.module.css';

const BlogHeader = () => (
  <div className={styles.header}>
    <h1 className={styles.title}>
      Bem vindo/a ao Blog do núcleo!
    </h1>
    <div>
      <h3 className={styles.subtitle}>
        O teu espaço para te manteres atualizado! Publicamos regularmente as últimas novidades, 
        eventos e informações mais importantes para todos os estudantes.
      </h3>
    </div>
  </div>
);

export default BlogHeader;
