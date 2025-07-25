"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FaChevronLeft, FaSearch } from "react-icons/fa";
import PostHeader from "@/components/blog/post/PostHeader";
import PostContent from "@/components/blog/post/PostContent";
import PostMeta from "@/components/blog/post/PostMeta";


interface Post {
  id: string;
  title: string;
  image?: string;
  description: string;
  author?: string;
  date?: string;
  tags?: string[];
}

function formatAuthorName(name?: string) {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1][0]}.`;
}


export default function PostPageClient({ post }: { post: Post }) {
  const router = useRouter();
  const tags: string[] = Array.isArray(post.tags) ? post.tags : [];
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Search bar e voltar */}
      <div className="flex items-center gap-2 mb-6">
        <button
          className="p-2 rounded hover:bg-muted transition-colors cursor-pointer mr-7"
          onClick={() => router.back()}
          aria-label="Voltar"
        >
          <FaChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Pesquisar posts..."
            className="w-full pl-10 pr-4 py-2 rounded border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
      <PostHeader title={post.title} image={post.image} />
      <PostContent description={post.description} />
      <hr className="my-6 border-gray-200" />
      <PostMeta author={post.author} date={post.date} tags={tags} />
    </div>
  );
}
