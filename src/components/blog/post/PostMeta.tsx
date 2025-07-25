import React from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface PostMetaProps {
  author?: string;
  date?: string;
  tags?: string[];
}

export default function PostMeta({ author, date, tags = [] }: PostMetaProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-muted-foreground">
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
      <div className="flex flex-col gap-2 items-end text-right">
        <span>{date ? new Date(date).toLocaleDateString('pt-PT') : ''}</span>
        <div className="flex gap-2 flex-wrap justify-end">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="bg-pink-100 text-pink-800">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
