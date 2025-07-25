import React from "react";
import Image from "next/image";

interface PostHeaderProps {
  title: string;
  image?: string;
}

export default function PostHeader({ title, image }: PostHeaderProps) {
  return (
    <>
      <h1 className="text-3xl font-bold mt-13 mb-4">{title}</h1>
      <div className="w-full h-80 relative mb-6 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
        <Image
          src={image || "/placeholder.jpg"}
          alt={title}
          fill
          className="object-cover w-full h-full bg-black"
          sizes="(max-width: 768px) 100vw, 768px"
        />
      </div>
    </>
  );
}
