import { PostCard } from "./PostCard";

interface Post {
  id: string;
  title: string;
  description: string;
  image?: string;
  date?: string;
  author?: string;
  tags?: string[];
}

interface PostGridProps {
  posts: Post[];
}

export function PostGrid({ posts }: PostGridProps) {
  if (!posts || posts.length === 0) {
    return (
      <div className="w-full flex justify-center p-30">
        <span className="text-gray-500 text-lg">Nenhum post encontrado.</span>
      </div>
    );
  }
  return (
    <div className="w-full flex justify-center p-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-10">
        {posts.map((item) => (
          <PostCard key={item.id} {...item} tags={item.tags || []} />
        ))}
      </div>
    </div>
  );
}
