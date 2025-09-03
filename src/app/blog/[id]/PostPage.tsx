"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FaChevronLeft } from "react-icons/fa";
import PostHeader from "@/components/blog/post/PostHeader";
import PostContent from "@/components/blog/post/PostContent";
import PostMeta from "@/components/blog/post/PostMeta";
import Link from "next/link";
import { useUser } from '@/context/UserContext';
import { UserRole } from '@/types/user';
import { Button } from "@/components/ui/button";
import styles from '@/styles/components/blog/post/PostPage.module.css';
import PostDeleteDialog from '@/components/blog/post/PostDeleteDialog';
import PostToast from '@/components/blog/post/PostToast';

interface Post {
  id: string;
  title: string;
  image?: string;
  description: string;
  author?: string;
  authors?: any[];
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

  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/blog/${post.id}`, { method: 'DELETE' });
      if (res.ok) {
        setTimeout(() => router.push('/blog'), 3000);
      } else {
        setToast({ type: 'error', message: 'Erro ao apagar o post' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Erro ao apagar o post' });
    } finally {
      setDeleting(false);
      setShowDialog(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.actions}>
          {canEdit && (
            <>
              <Link href={`/blog/edit/${post.id}`} className={styles.editLink}>
                <Button className={styles.editButton}>
                  Editar post
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
      {toast && (
        <PostToast type={toast.type} message={toast.message} />
      )}
      <div className={styles.postMetaRow}>
        <button
          className={styles.backButton}
          onClick={() => router.back()}
          aria-label="Voltar"
        >
          <FaChevronLeft className="w-5 h-5" />
        </button>
        <div className={styles.metaFlex}>
          <PostMeta
            authors={
              Array.isArray(post.authors)
                ? post.authors.map((a: any) => {
                    if (typeof a === 'string') return { name: a, photo: undefined, email: undefined };
                    if (a && typeof a === 'object') return { name: a.name, photo: a.photo, email: a.email };
                    return { name: '?', photo: undefined, email: undefined };
                  })
                : post.author
                ? [{ name: post.author, photo: undefined, email: undefined }]
                : []
            }
            date={post.date}
            tags={tags}
            content={post.description}
          />
        </div>
      </div>
      <PostHeader title={post.title} image={post.image} />
      <PostContent description={post.description} />
      <hr className={styles.divider} />
    </div>
  );
}
