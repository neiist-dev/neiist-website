import React from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface PostMetaProps {
  author?: string;
  date?: string;
  tags?: string[];
  content?: string;
}

export default function PostMeta({ author, date, tags = [], content }: PostMetaProps) {
  function getReadingTime(text?: string) {
  if (!text || !text.trim()) return 0;

  // Remove HTML tags and collapse multiple spaces
  const plain = text
    .replace(/<[^>]*>/g, " ") // remove HTML tags
    .replace(/\s+/g, " ") // collapse spaces
    .trim();

  const words = plain.split(" ").filter(Boolean).length;
  const minutes = Math.ceil(words / 200); // average reading speed ~200 wpm

  console.log("Words: ", words);
  console.log("Minutes: ", minutes);

  return minutes;
}

  const readingTime = getReadingTime(content);

  return (
    <div className="flex flex-row items-center justify-between gap-3 text-sm text-muted-foreground w-full flex-wrap">
      <div className="flex items-center gap-2">
        <Avatar className="w-10 h-10">
          <AvatarImage src="TODO" alt={author} />
          <AvatarFallback>{author ? author[0] : "?"}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Artigo publicado por:</span>
          <span className="text-sm text-black font-bold leading-tight">{author}</span>
        </div>
      </div>
      <span className="text-xs text-black-300 font-semibold">
        {readingTime < 1 ? "< 1 min" : `~ ${readingTime} min`}
      </span>

      <div className="flex flex-col gap-2 items-end text-right">
        <span>{date ? new Date(date).toLocaleDateString('pt-PT') : ''}</span>
        <div className="flex gap-2 flex-wrap justify-end">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="bg-blue-100 text-blue-800">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

    </div>
  );
}
