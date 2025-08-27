import { PostCard } from "./PostCard";
import styles from '@/styles/components/blog/mainpage/PostGrid.module.css';

interface Post {
  id: string;
  title: string;
  description: string;
  image?: string;
  date?: string;
  authors?: string[];
  tags?: string[];
}

interface PostGridProps {
  posts: Post[];
}

export function PostGrid({ posts }: PostGridProps) {
  if (!posts || posts.length === 0) {
    return (
      <div className={styles.centeredRow}>
        <span className={styles.noPosts}>Nenhum post encontrado.</span>
      </div>
    );
  }
  return (
    <div className={styles.centeredRow}>
      <div className={styles.postGrid}>
        {posts.map((item) => (
          <PostCard key={item.id} {...item} tags={item.tags || []} authors={item.authors || []} />
        ))}
      </div>
    </div>
  );
}
