import React from 'react';
import styles from '@/styles/pages/BlogPage.module.css';

const BlogHeader = () => (
  <div className={styles.header}>
    <h1 className="scroll-m-20 text-center text-3xl pt-5 font-extrabold tracking-tight text-balance">
      Bem vindo/a ao Blog do núcleo!
    </h1>
    <div>
      <p className="leading-7  p-3 [&:not(:first-child)]:mt-6 sm:mx-20 md:mx-40 lg:mx-80">
        O teu espaço para te manteres atualizado! Publicamos regularmente as últimas novidades, 
        eventos e informações mais importantes para todos os estudantes.
      </p>
    </div>
  </div>
);

export default BlogHeader;
