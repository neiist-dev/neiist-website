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
    { title: "Primeira Notícia", description: "Descrição curta da primeira notícia para testar o card.", image: "", date: "23/07/2025", author: "João Silva", tag: "Tag 1" },
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



