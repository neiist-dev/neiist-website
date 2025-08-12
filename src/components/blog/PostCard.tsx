import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export interface AuthorCard {
  name: string;
  photo?: string | null;
}

export interface PostCardProps {
  id: string;
  title: string;
  description: string;
  image?: string;
  date?: string;
  authors?: (string | AuthorCard)[];
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

  // Suporte a array de string ou array de objetos {name, photo}
  const authorList: { name: string; photo?: string | null }[] = Array.isArray(authors)
    ? authors.map(a => typeof a === 'string' ? { name: a } : { name: a.name, photo: a.photo })
    : [];
  const maxAvatars = 3;
  const showAuthors = authorList.slice(0, maxAvatars);
  const extraAuthors = authorList.length - maxAvatars;

  return (
    <Link href={`/blog/${id}`} className="block group">
      <Card className="w-full max-w-xs h-[470px] flex flex-col overflow-hidden group-hover:shadow-lg transition-shadow cursor-pointer">
        <div className="px-4">
          <div className="w-full aspect-[16/9] bg-muted flex items-center justify-center rounded-lg overflow-hidden relative">
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <Image
                src={getImageSrc(image)}
                alt={title}
                style={{ objectFit: 'cover', borderRadius: '0.5rem', maxWidth: '100%', maxHeight: '100%' }}
                fill
                sizes="(max-width: 384px) 100vw, 384px"
                priority={false}
              />
            </div>  
          </div>
        </div>
        <CardHeader className="min-h-0">
          <div className="flex items-center text-sm text-muted-foreground space-x-2 min-w-0">
            <div className="flex -space-x-2">
              {showAuthors.map((a, idx) => (
                <Avatar
                  key={a.name + idx}
                  className="w-8 h-8 border-2 border-white shadow-sm z-10"
                  style={{ zIndex: 10 - idx }}
                >
                  {a.photo ? (
                    <AvatarImage src={a.photo} alt={a.name} />
                  ) : null}
                  <AvatarFallback>{a.name ? a.name[0].toUpperCase() : "?"}</AvatarFallback>
                </Avatar>
              ))}
              {extraAuthors > 0 && (
                <Avatar className="w-8 h-8 border-2 border-white bg-gray-200 text-gray-700 font-bold shadow-sm z-0 flex items-center justify-center">
                  <span className="w-full h-full flex items-center justify-center text-base">{extraAuthors}</span>
                </Avatar>
              )}
            </div>
            <span className="sm:inline block mt-1 sm:mt-0" style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            </span>
              <span className="flex-1 min-w-0" />
              <span className="block text-right min-w-[80px] truncate">
                {date ? new Date(date).toLocaleDateString('pt-PT') : ''}
              </span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 min-h-0">
          <CardTitle className="text-base leading-snug line-clamp-3 break-words max-w-full">{title}</CardTitle>
          <div
            className="text-sm text-muted-foreground line-clamp-3 break-words max-w-full"
            style={{ wordBreak: 'break-word', overflow: 'hidden' }}
            dangerouslySetInnerHTML={{ __html: descriptionNoFormatting }}
          />
          <div className="flex flex-wrap gap-2 overflow-hidden">
            {tags && tags.length > 0 && tags.map((tag, idx) => (
              <Badge key={idx} variant="outline" className="w-fit bg-blue-100 text-blue-800 truncate max-w-full">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );

