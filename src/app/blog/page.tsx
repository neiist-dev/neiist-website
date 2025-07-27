"use client";

import React, { useState, useRef, useEffect } from 'react';
import { UserRole } from '@/types/user';
import MemberControls from '@/components/blog/MemberControls';
import styles from '@/styles/pages/BlogPage.module.css';
import { Switch } from '@/components/ui/switch';
import { useUser } from '@/context/UserContext';
import { FaSearch, FaChevronLeft } from 'react-icons/fa';
import BlogHeader from '@/components/blog/BlogHeader';
import BlogToolbar from '@/components/blog/BlogToolbar';
import BlogFilterbar from '@/components/blog/BlogFilterbar';


import { PostGrid } from "@/components/blog/PostGrid"
import Pagination from "@/components/blog/Pagination";
import Newsletter from "@/components/blog/Newsletter";


export default function BlogPage() {
  const { user, loading } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const pageSize = 6;
  const pageCount = Math.ceil(posts.length / pageSize);
  const paginatedPosts = posts.slice((page - 1) * pageSize, page * pageSize);

  const fetchPosts = async (searchQuery = "") => {
    try {
      const url = searchQuery ? `/api/blog?search=${encodeURIComponent(searchQuery)}` : '/api/blog';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Erro fetching posts');
      const data = await res.json();
      setPosts(data);
      setPage(1); // Volta à primeira página ao pesquisar
    } catch (err) {
      setPosts([]);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSearch = (query: string) => {
    setSearch(query);
    fetchPosts(query);
  };

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

  const isMember = user && user.roles?.includes(UserRole.MEMBER);
  const [memberView, setMemberView] = useState(true);

  return (
    <div className={styles.container}>
      <BlogFilterbar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col items-center gap-2 mb-4">
        <BlogHeader />
        {!isMember && (
          <MemberControls memberView={memberView} setMemberView={setMemberView} />
        )}
      </div>
      <div ref={toolbarRef}>
        <BlogToolbar onFilterClick={() => setSidebarOpen(true)} onSearch={handleSearch} />
      </div>
      <div className={styles.content}>
        <PostGrid posts={paginatedPosts} />
        <Pagination page={page} pageCount={pageCount} setPage={setPage} />
        <Newsletter />
      </div>
    </div>
  );
}



