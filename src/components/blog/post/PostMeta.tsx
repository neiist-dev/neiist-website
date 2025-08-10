import React from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface AuthorMeta {
  name: string;
  photo?: string | null;
}

interface PostMetaProps {
  authors?: (string | AuthorMeta)[];
  date?: string;
  tags?: string[];
  content?: string;
}

export default function PostMeta({ authors = [], date, tags = [], content }: PostMetaProps) {
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

  // Garante que o primeiro autor é sempre um objeto {name, photo}
  let avatarName = "?";
  let avatarPhoto: string | undefined | null = undefined;
  if (Array.isArray(authors) && authors.length > 0) {
    const a = authors.find(a => a && ((typeof a === 'object' && a.name) || typeof a === 'string'));
    if (typeof a === 'string') {
      avatarName = a;
    } else if (a && typeof a === 'object') {
      avatarName = a.name;
      avatarPhoto = a.photo;
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-muted-foreground w-full flex-wrap p-2">
      <div className="flex items-center gap-2 mb-2 sm:mb-0">
        <Avatar className="w-10 h-10">
          {avatarPhoto ? (
            <AvatarImage src={avatarPhoto} alt={avatarName} />
          ) : null}
          <AvatarFallback>{avatarName ? avatarName[0] : "?"}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Artigo publicado por:</span>
          <span className="text-sm text-black font-bold leading-tight">{
            Array.isArray(authors)
              ? authors.map(a => typeof a === "string" ? a : a.name).join(', ')
              : ""
          }</span>
        </div>
      </div>
      <span className="text-xs text-black-300 font-semibold mb-2 sm:mb-0">
        {readingTime < 1 ? "< 1 min" : `~ ${readingTime} min`}
      </span>
      <div className="flex flex-col gap-2 items-start sm:items-end text-left sm:text-right">
        <span>{date ? new Date(date).toLocaleDateString('pt-PT') : ''}</span>
        <div className="flex gap-2 flex-wrap justify-start sm:justify-end">
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
