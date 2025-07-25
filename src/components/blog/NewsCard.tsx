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

interface NewsCardProps {
  title: string
  description: string
  image?: string
  date?: string
  author?: string
  tag?: string
}

export function NewsCard({
  title,
  description,
  image,
  date,
  author,
  tag,
}: NewsCardProps) {
  return (
    <Card className="w-full max-w-xs flex flex-col overflow-hidden">
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
            <AvatarImage src="TODO" alt={author} />
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
        <CardTitle className="text-base leading-snug mt-2">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground line-clamp-3">{description}</p>
        <Badge variant="outline" className="w-fit bg-pink-100 text-pink-800"> {/* TODO - attribute to each tag a diff color */}
          {tag}
        </Badge>
      </CardContent>
    </Card>
  )
}
