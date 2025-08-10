import PostPageClient from "./PostPage";

interface PostPageProps {
  params: { id: string };
  searchParams: Record<string, string>;
}

import { headers } from "next/headers";

async function fetchPostById(id: string) {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const url = `${protocol}://${host}/api/blog/${id}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Post não encontrado');
  return res.json();
}


export default async function PostPage({ params }: PostPageProps) {
  const resolvedParams = await params;
  const post = await fetchPostById(resolvedParams.id);
  return <PostPageClient post={post} />;
}
