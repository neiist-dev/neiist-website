"use client";

import React, { useState, useRef, useEffect } from 'react';
import styles from '@/styles/pages/BlogPage.module.css';
import AdminBlogPage from '@/app/blog/admin';
import { useUser } from '@/context/UserContext';
import { FaSearch, FaChevronLeft } from 'react-icons/fa';
import BlogHeader from '@/components/blog/BlogHeader';
import BlogToolbar from '@/components/blog/BlogToolbar';
import BlogFilterbar from '@/components/blog/BlogFilterbar';


import { NewsGrid } from "@/components/blog/NewsGrid"
import Pagination from "@/components/blog/Pagination";
import Newsletter from "@/components/blog/Newsletter";


export default function BlogPage() {
  const { user, loading } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const allNews = [
    { title: "Primeira Notícia", description: "Descrição curta da primeira notícia para testar o card.", image: "", date: "23/07/2025", author: "Autor 1", tag: "Tag 1" },
    { title: "Segunda Notícia", description: "Outra notícia interessante para mostrar o grid.", image: "", date: "22/07/2025", author: "Autor 2", tag: "Tag 2" },
    { title: "Terceira Notícia", description: "Mais uma notícia para preencher a grid de cards.", date: "21/07/2025", author: "Autor 3", tag: "Tag 3" },
    { title: "Primeira Notícia", description: "Descrição curta da primeira notícia para testar o card.", image: "", date: "23/07/2025", author: "Autor 1", tag: "Tag 1" },
    { title: "Segunda Notícia", description: "Outra notícia interessante para mostrar o grid.", image: "", date: "22/07/2025", author: "Autor 2", tag: "Tag 2" },
    { title: "Terceira Notícia", description: "Mais uma notícia para preencher a grid de cards.", image: "", date: "21/07/2025", author: "Autor 3", tag: "Tag 3" },
    { title: "Quarta Notícia", description: "Notícia extra para testar a paginação.", image: "", date: "20/07/2025", author: "Autor 4", tag: "Tag 4" },
    { title: "Quinta Notícia", description: "Mais uma notícia para testar a paginação.", image: "", date: "19/07/2025", author: "Autor 5", tag: "Tag 5" },
    { title: "Sexta Notícia", description: "Notícia para completar a segunda página.", image: "", date: "18/07/2025", author: "Autor 6", tag: "Tag 6" },
    { title: "Sétima Notícia", description: "Notícia para completar a segunda página.", image: "", date: "17/07/2025", author: "Autor 7", tag: "Tag 7" },
    { title: "Oitava Notícia", description: "Notícia para completar a segunda página.", image: "", date: "16/07/2025", author: "Autor 8", tag: "Tag 8" },
    { title: "Nona Notícia", description: "Notícia para completar a segunda página.", image: "", date: "15/07/2025", author: "Autor 9", tag: "Tag 9" },
    { title: "Décima Notícia", description: "Notícia para completar a segunda página.", image: "", date: "14/07/2025", author: "Autor 10", tag: "Tag 10" },
    { title: "Décima Primeira Notícia", description: "Notícia para completar a segunda página.", image: "", date: "13/07/2025", author: "Autor 11", tag: "Tag 11" },
    { title: "Décima Segunda Notícia", description: "Notícia para completar a segunda página.", image: "", date: "12/07/2025", author: "Autor 12", tag: "Tag 12" },
    { title: "Décima Terceira Notícia", description: "Notícia para completar a segunda página.", image: "", date: "11/07/2025", author: "Autor 13", tag: "Tag 13" },
    { title: "Décima Quarta Notícia", description: "Notícia para completar a segunda página.", image: "", date: "10/07/2025", author: "Autor 14", tag: "Tag 14" },
    { title: "Décima Quinta Notícia", description: "Notícia para completar a segunda página.", image: "", date: "09/07/2025", author: "Autor 15", tag: "Tag 15" },
  ];

  const pageSize = 6;
  const [page, setPage] = useState(1);
  const pageCount = Math.ceil(allNews.length / pageSize);
  const paginatedNews = allNews.slice((page - 1) * pageSize, page * pageSize);

  const toolbarRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (toolbarRef.current) {
    const y = toolbarRef.current.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
}, [page]);

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
      <div ref={toolbarRef}>
        <BlogToolbar onFilterClick={() => setSidebarOpen(true)} />
      </div>
      <div className={styles.content}>
        <NewsGrid news={paginatedNews} />
        <Pagination page={page} pageCount={pageCount} setPage={setPage} />
        <Newsletter />
      </div>
    </div>
  );
}



