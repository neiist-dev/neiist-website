import { NewsCard } from "./NewsCard";


interface News {
  id: string;
  title: string;
  description: string;
  image?: string;
  date?: string;
  author?: string;
  tags?: string[];
}

interface NewsGridProps {
  news: News[];
}

export function NewsGrid({ news }: NewsGridProps) {
  return (
    <div className="w-full flex justify-center p-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-10">
        {news.map((item) => (
          <NewsCard key={item.id} {...item} tags={item.tags || []} />
        ))}
      </div>
    </div>
  );
}
