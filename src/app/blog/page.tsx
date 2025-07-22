"use client";

import styles from '@/styles/pages/BlogPage.module.css';
import AdminBlogPage from '@/app/blog/admin';
import { useUser } from '@/context/UserContext';

export default function BlogPage() {
  const { user, loading } = useUser();
  
  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }
  
  const isMember = user && ['Member', 'Collaborator', 'Admin'].includes(user.status);
  
  if (isMember) {
    return <AdminBlogPage />;
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Bem-vindo/a ao Blog do Núcleo!</h1>
        <div className={styles.headerInfo}>
          <span>O teu espaço para te manteres atualizado! Publicamos regularmente as últimas novidades,</span>
          <span> eventos e informações mais importantes para todos os estudantes.</span>
        </div>
      </div>
      <div className={styles.content}>
        ARTIGOS
      </div>
    </div>
  );
}
