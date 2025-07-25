import NewsPageClient from "./NewsPageClient";

interface NewsPageProps {
  params: { id: string };
  searchParams: Record<string, string>;
}

import { headers } from "next/headers";

async function fetchNewsById(id: string) {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const url = `${protocol}://${host}/api/blog/${id}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Notícia não encontrada');
  return res.json();
}

export default async function NewsPage({ params }: NewsPageProps) {
  const news = await fetchNewsById(params.id);
  return <NewsPageClient news={news} />;
}
