import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export interface PostCardProps {
  id: string;
  title: string;
  description: string;
  image?: string;
  date?: string;
  authors?: string[];
  tags?: string[];
}

export function PostCard({ id, title, description, image, date, authors = [], tags = [] }: PostCardProps) {
  // Remove heading, bold, e itálico da descrição do post no postcard
  function stripFormatting(html: string) {
    let clean = html.replace(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi, "");
    clean = clean.replace(/<(b|strong)[^>]*>(.*?)<\/(b|strong)>/gi, "$2");
    clean = clean.replace(/<(i|em)[^>]*>(.*?)<\/(i|em)>/gi, "$2");
    return clean;
  }

  const descriptionNoFormatting = stripFormatting(description);

  // prefixo data:image/jpeg;base64,
  function getImageSrc(img?: string) {
    if (!img || img === "null" || img.trim() === "") return "/placeholder.jpg";
    if (img.startsWith("data:")) return img;
    if (/^[A-Za-z0-9+/=]+$/.test(img.substring(0, 20))) {
      return `data:image/jpeg;base64,${img}`;
    }
    return img;
  }

  return (

    <Link href={`/blog/${id}`} className="block group">
      <Card className="w-full max-w-xs h-[470px] flex flex-col overflow-hidden group-hover:shadow-lg transition-shadow cursor-pointer">
        <div className="px-4 pt-4">
          <div className="w-full aspect-[16/9] bg-muted flex items-center justify-center rounded-lg overflow-hidden relative">
            {image && getImageSrc(image) !== "/placeholder.jpg" ? (
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <Image
                  src={getImageSrc(image)}
                  alt={title}
                  style={{ objectFit: 'cover', borderRadius: '0.5rem' }}
                  fill
                  sizes="(max-width: 384px) 100vw, 384px"
                  priority={false}
                />
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Sem imagem</div>
            )}
          </div>
        </div>
        <CardHeader className="gap-2">
          <div className="flex items-center text-sm text-muted-foreground space-x-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback>{authors[0] ? authors[0][0] : "?"}</AvatarFallback>
            </Avatar>
            <span className="text-gray-800 truncate max-w-[110px] block">
              {authors.length > 0 ? authors.join(', ') : ''}
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
              <Badge key={idx} variant="outline" className="w-fit bg-blue-100 text-blue-800">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );

