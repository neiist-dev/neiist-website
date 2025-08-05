"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FaChevronLeft, FaSearch } from "react-icons/fa";
import PostHeader from "@/components/blog/post/PostHeader";
import PostContent from "@/components/blog/post/PostContent";
import PostMeta from "@/components/blog/post/PostMeta";
import Link from "next/link";
import { useUser } from '@/context/UserContext';
import { UserRole } from '@/types/user';
import { Button } from "@/components/ui/button";

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
  const { user } = useUser();
  const tags: string[] = Array.isArray(post.tags) ? post.tags : [];
  const canEdit = user && (user.roles.includes(UserRole.MEMBER) || user.roles.includes(UserRole.COORDINATOR) || user.roles.includes(UserRole.ADMIN));
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Search bar e voltar */}
      <div className="flex items-center mb-6 justify-between">
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded hover:bg-muted transition-colors cursor-pointer mr-7"
            onClick={() => router.back()}
            aria-label="Voltar"
          >
            <FaChevronLeft className="w-5 h-5" />
          </button>
        </div>
        {!canEdit && ( // TODO - corrigir no fim
          <Link href={`/blog/new?edit=${post.id}`} className="flex justify-end">
            <Button className="px-4 py-2 bg-red-400 text-white font-semibold hover:bg-red-500 transition-colors cursor-pointer">
              Editar post
            </Button>
          </Link>
        )}
      </div>
      <PostMeta author={post.author} date={post.date} tags={tags} />
      <PostHeader title={post.title} image={post.image} />
      <PostContent description={post.description} />
      <hr className="my-6 border-gray-200" />
    </div>
  );
}
