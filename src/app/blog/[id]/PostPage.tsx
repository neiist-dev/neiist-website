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
      </div>
      <PostMeta author={post.author} date={post.date} tags={tags} />
      <PostHeader title={post.title} image={post.image} />
      <PostContent description={post.description} />
      <hr className="my-6 border-gray-200" />
    </div>
  );
}
