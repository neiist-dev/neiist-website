import * as React from "react"
import Image from "next/image"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

import Link from "next/link"


interface PostCardProps {
  id: string
  title: string
  description: string
  image?: string
  date?: string
  author?: string
  tags?: string[];
}
export function PostCard(props: PostCardProps) {
  const { id, title, description, image, date, author, tags = [] } = props;


  // Remove heading, bold, and italic tags from description
  function stripFormatting(html: string) {
    // Remove headings
    let clean = html.replace(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi, "");
    // Remove bold tags
    clean = clean.replace(/<(b|strong)[^>]*>(.*?)<\/(b|strong)>/gi, "$2");
    // Remove italic tags
    clean = clean.replace(/<(i|em)[^>]*>(.*?)<\/(i|em)>/gi, "$2");
    return clean;
  }

  const descriptionNoFormatting = stripFormatting(description);

  return (
    <Link href={`/blog/${id}`} className="block group">
      <Card className="w-full max-w-xs h-[460px] flex flex-col overflow-hidden group-hover:shadow-lg transition-shadow cursor-pointer">
        <div className="px-4 pt-4">
          <div className="w-full h-36 bg-muted flex items-center justify-center rounded-lg overflow-hidden">
            {image ? (
              <Image
                src={image}
                alt={title}
                fill
                className="object-cover w-full h-full"
                sizes="(max-width: 384px) 100vw, 384px"
              />
            ) : (
              <div className="text-sm text-muted-foreground">Sem imagem</div>
            )}
          </div>
        </div>

        <CardHeader className="gap-2">
          <div className="flex items-center text-sm text-muted-foreground space-x-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src="avatar_TODO" alt={author} />
              <AvatarFallback>{author ? author[0] : "?"}</AvatarFallback>
            </Avatar>
            <span className="text-gray-800 truncate max-w-[110px] block">
              {author ? (() => {
                const parts = author.trim().split(' ');
                if (parts.length === 1) return parts[0];
                const full = `${parts[0]} ${parts[1]}`;
                if (full.length <= 16) return full;
                return `${parts[0]} ${parts[1][0]}.`;
              })() : ''}
            </span>
            <span>|</span>
            <span className="sm:inline block mt-1 sm:mt-0">
              {date ? new Date(date).toLocaleDateString('pt-PT') : ''}
            </span>
          </div>
          <CardTitle className="text-base leading-snug mt-3">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div
            className="text-sm text-muted-foreground line-clamp-3 prose prose-sm"
            dangerouslySetInnerHTML={{ __html: descriptionNoFormatting }}
          />
          <div className="flex flex-wrap gap-2">
            {tags && tags.length > 0 && tags.map((tag, idx) => (
              <Badge key={idx} variant="outline" className="w-fit bg-pink-100 text-pink-800">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
