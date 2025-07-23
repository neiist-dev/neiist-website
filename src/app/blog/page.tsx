"use client";

import React, { useState } from 'react';
import styles from '@/styles/pages/BlogPage.module.css';
import AdminBlogPage from '@/app/blog/admin';
import { useUser } from '@/context/UserContext';
import { FaSearch, FaChevronLeft } from 'react-icons/fa';
import BlogHeader from '@/components/blog/BlogHeader';
import BlogToolbar from '@/components/blog/BlogToolbar';
import BlogFilterbar from '@/components/blog/BlogFilterbar';

import { NewsGrid } from "@/components/blog/NewsGrid"

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
      <BlogFilterbar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <BlogHeader />
      <BlogToolbar onFilterClick={() => setSidebarOpen(true)} />
      <div className={styles.content}>
        <NewsGrid
          news={[
            {
              title: "Primeira Notícia",
              description: "Descrição curta da primeira notícia para testar o card.",
              image: "",
              date: "23/07/2025",
              author: "Autor 1",
              tag: "Tag 1"
            },
            {
              title: "Segunda Notícia",
              description: "Outra notícia interessante para mostrar o grid.",
              image: "",
              date: "22/07/2025",
              author: "Autor 2",
              tag: "Tag 2"
            },
            {
              title: "Terceira Notícia",
              description: "Mais uma notícia para preencher a grid de cards.",
              date: "21/07/2025",
              author: "Autor 3",
              tag: "Tag 3"
            },
            {
              title: "Primeira Notícia",
              description: "Descrição curta da primeira notícia para testar o card.",
              image: "",
              date: "23/07/2025",
              author: "Autor 1",
              tag: "Tag 1"
            },
            {
              title: "Segunda Notícia",
              description: "Outra notícia interessante para mostrar o grid.",
              image: "",
              date: "22/07/2025",
              author: "Autor 2",
              tag: "Tag 2"
            },
            {
              title: "Terceira Notícia",
              description: "Mais uma notícia para preencher a grid de cards.",
              image: "",
              date: "21/07/2025",
              author: "Autor 3",
              tag: "Tag 3"
            }
          ]}
        />
      </div>
    </div>
  );
}

