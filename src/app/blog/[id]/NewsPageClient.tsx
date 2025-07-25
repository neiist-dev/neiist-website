"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FaChevronLeft, FaSearch } from "react-icons/fa";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface News {
  id: string;
  title: string;
  image?: string;
  description: string;
  author?: string;
  date?: string;
  tag?: string;
}

function formatAuthorName(name?: string) {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1][0]}.`;
}

export default function NewsPageClient({ news }: { news: News }) {
  const router = useRouter();
  const tags: string[] = typeof news.tag === 'string' && news.tag.length > 0
    ? news.tag.split(',').map((t: string) => t.trim()).filter(Boolean)
    : [];
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
            placeholder="Pesquisar notícias..."
            className="w-full pl-10 pr-4 py-2 rounded border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Título e imagem */}
      <h1 className="text-3xl font-bold mt-13 mb-4">{news.title}</h1>
      <div className="w-full h-80 relative mb-6 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
        <Image
          src={news.image || "/placeholder.jpg"}
          alt={news.title}
          fill
          className="object-cover w-full h-full bg-black"
          sizes="(max-width: 768px) 100vw, 768px"
        />
      </div>

      {/* Conteúdo */}
      <div className="prose prose-neutral max-w-none mb-8">
        {news.description}
      </div>

      {/* Linha */}
      <hr className="my-6 border-gray-200" />

      {/* Info autor, data, tags */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Avatar className="w-10 h-10">
            <AvatarImage src="TODO" alt={news.author} />
            <AvatarFallback>{news.author ? news.author[0] : "?"}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Artigo publicado por:</span>
            <span className="text-sm text-black font-bold leading-tight">{news.author}</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 sm:items-start">
          <span>{news.date ? new Date(news.date).toLocaleDateString('pt-PT') : ''}</span>
          <div className="flex gap-2 flex-wrap">
            {tags.map((tag) => (
              <Badge key={tag} variant="outline" className="bg-pink-100 text-pink-800">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
}
