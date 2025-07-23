"use client";

import React, { useState } from 'react';
import styles from '@/styles/pages/BlogPage.module.css';
import AdminBlogPage from '@/app/blog/admin';
import { useUser } from '@/context/UserContext';
import { FaSearch, FaChevronLeft } from 'react-icons/fa';
import BlogHeader from '@/components/blog/BlogHeader';
import BlogToolbar from '@/components/blog/BlogToolbar';
import BlogFilterbar from '@/components/blog/BlogFilterbar';

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
        ARTIGOS
      </div>
    </div>
  );
}

