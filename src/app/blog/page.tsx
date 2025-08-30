"use client";

import React, { useState, useRef, useEffect } from 'react';
import { UserRole } from '@/types/user';
import MemberControls from '@/components/blog/main-page/admincontrols/MemberControls';
import styles from '@/styles/pages/BlogPage.module.css';
import { useUser } from '@/context/UserContext';
import BlogHeader from '@/components/blog/main-page/BlogHeader';
import BlogToolbar from '@/components/blog/main-page/BlogToolbar';
import BlogFilterbar from '@/components/blog/main-page/filterbar/BlogFilterbar';
import { PostGrid } from "@/components/blog/main-page/PostGrid"
import Pagination from "@/components/blog/main-page/Pagination";
import Newsletter from "@/components/blog/main-page/Newsletter";

export default function BlogPage() {
  const { user, loading } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const pageSize = 6;
  const pageCount = Math.ceil(posts.length / pageSize);
  const paginatedPosts = posts.slice((page - 1) * pageSize, page * pageSize);

  const fetchPosts = async (searchQuery = "", filterTags: string[] = []) => {
    try {
      let url = '/api/blog';
      const params = [];
      if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`);
      if (filterTags.length > 0) params.push(`tags=${encodeURIComponent(filterTags.join(","))}`);
      if (params.length > 0) url += `?${params.join("&")}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Erro fetching posts');
      const data = await res.json();
      setPosts(data);
      setPage(1);
    } catch (err) {
      setPosts([]);
    }
  };

  useEffect(() => {
    fetchPosts(search, filters);
  }, [filters]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSearch = (query: string) => {
    setSearch(query);
    fetchPosts(query, filters);
  };

  const handleFilterChange = (selectedFilters: string[]) => {
    setFilters(selectedFilters);
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
      <BlogFilterbar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onFilterChange={handleFilterChange}
      />
      <div className={styles.headerSection}>
        <BlogHeader />
        {isMember && (
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



