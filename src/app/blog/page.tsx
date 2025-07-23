"use client";

import React, { useState } from 'react';
import styles from '@/styles/pages/BlogPage.module.css';
import AdminBlogPage from '@/app/blog/admin';
import { useUser } from '@/context/UserContext';
import { FaSearch, FaChevronLeft } from 'react-icons/fa';

export default function BlogPage() {
  const { user, loading } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  const isMember = user && ['Member', 'Collaborator', 'Admin'].includes(user.status);

  if (isMember) {
    return <AdminBlogPage />;
  }

  return (
    <div className={styles.container}>
      {/* Sidebar dos filtros */}
      <div className={styles.sidebar + (sidebarOpen ? ' ' + styles.sidebarOpen : '')}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarTitle}>Filtros</span>
          <button className={styles.sidebarClose} onClick={() => setSidebarOpen(false)}>
            <FaChevronLeft />
          </button>
        </div>
        {/* Opções de filtros aqui */}
      </div>
      
      {sidebarOpen && <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}

      <div className={styles.header}>
        <h1 className={styles.title}>Bem-vindo/a ao Blog do Núcleo!</h1>
        <div className={styles.headerInfo}>
          <span>O teu espaço para te manteres atualizado! Publicamos regularmente as últimas novidades,</span>
          <span> eventos e informações mais importantes para todos os estudantes.</span>
        </div>
      </div>
      <div className={styles.toolbar}>
        <button className={styles.filterButton} onClick={() => setSidebarOpen(true)}>Filtros</button>
        <div className={styles.searchWrapper}>
          <FaSearch className={styles.searchIcon} />
          <input
            className={styles.searchBar}
            type="text"
            placeholder="Pesquisar por artigos..."
          />
        </div>
      </div>
      <div className={styles.content}>
        ARTIGOS
      </div>
    </div>
  );
}

