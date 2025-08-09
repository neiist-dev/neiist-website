import React from "react";
import Image from "next/image";

interface PostHeaderProps {
  title: string;
  image?: string;
}

export default function PostHeader({ title, image }: PostHeaderProps) {

  const getImageSrc = (img?: string) => {
    if (!img) return "/placeholder.jpg";
    if (img.startsWith('data:')) return img;
    if (/^[A-Za-z0-9+/=]+$/.test(img.substring(0, 20))) {
      return `data:image/jpeg;base64,${img}`;
    }
    return img;
  };
  return (
    <>
      <hr className="my-6 border-gray-200" />
      <h1 className="text-4xl font-bold mt-8 mb-4">{title}</h1>
      <div className="w-full aspect-[16/9] relative mb-6 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
        <Image
          src={getImageSrc(image)}
          alt={title}
          fill
          className="object-cover w-full h-full bg-black"
          sizes="(max-width: 768px) 100vw, 768px"
        />
      </div>
    </>
  );
}
