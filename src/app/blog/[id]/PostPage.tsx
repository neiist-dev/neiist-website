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
  const [toast, setToast] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const router = useRouter();
  const { user } = useUser();
  const tags: string[] = Array.isArray(post.tags) ? post.tags : [];
  const [showDialog, setShowDialog] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  
  const canEdit = user && (user.roles.includes(UserRole.MEMBER) || user.roles.includes(UserRole.COORDINATOR) || user.roles.includes(UserRole.ADMIN));
  
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/blog/${post.id}`, { method: 'DELETE' });
      if (res.ok) {
        setToast({ type: 'success', message: 'Post apagado com sucesso!' });
        setTimeout(() => router.push('/blog'), 1800);
      } else {
        setToast({ type: 'error', message: 'Erro ao apagar o post' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Erro ao apagar o post' });
    } finally {
      setDeleting(false);
      setShowDialog(false);
    }
  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  };

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
        <div className="flex items-center gap-2 ml-auto">
          {!canEdit && (
            <Link href={`/blog/new?edit=${post.id}`} className="flex justify-end">
              <Button className="px-4 py-2 bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors cursor-pointer">
                Editar post
              </Button>
            </Link>
          )}
          <Button
            className="px-4 py-2 bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors cursor-pointer"
            onClick={() => setShowDialog(true)}
          >
            Apagar Post
          </Button>
      
          {showDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60"></div>
              <div className="relative bg-white rounded-lg shadow-lg p-6 min-w-[320px] flex flex-col items-center">
                <span className="mb-4 text-lg font-semibold text-gray-800">Tens a certeza que queres apagar este post?</span>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setShowDialog(false)} className="px-4 cursor-pointer">Cancelar</Button>
                  <Button onClick={handleDelete} className="px-4 bg-red-500 hover:bg-red-600 text-white cursor-pointer" disabled={deleting}>
                    {deleting ? 'A apagar...' : 'Apagar'}
                  </Button>
                </div>
              </div>
            </div>
          
          )}
        </div>
      </div>
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-4 py-2 rounded shadow-lg text-white font-semibold transition-all ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}
      <PostMeta author={post.author} date={post.date} tags={tags} />
      <PostHeader title={post.title} image={post.image} />
      <PostContent description={post.description} />
      <hr className="my-6 border-gray-200" />
    </div>
  );
}
