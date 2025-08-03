import React from "react";

interface PostContentProps {
  description: string;
}

export default function PostContent({ description }: PostContentProps) {
  return (
    <div
      className="prose prose-neutral max-w-none mb-8"
      dangerouslySetInnerHTML={{ __html: description }}
    />
  );
}
