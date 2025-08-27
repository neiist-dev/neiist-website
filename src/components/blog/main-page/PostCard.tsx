import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import styles from '@/styles/components/blog/mainpage/PostCard.module.css';

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
  <Link href={`/blog/${id}`} className={styles.noDecoration}>
      <Card className={styles.postCard}>
        <div>
          <img
            src={getImageSrc(image)}
            alt={title}
            className={styles.postImage}
          />
        </div>
        <CardHeader>
          <div className={styles.postMeta}>
            <div className={styles.authorRow}>
              {showAuthors.map((a, idx) => (
                <Avatar
                  key={a.name + idx}
                  className={styles.authorAvatar}
                >
                  {a.photo ? (
                    <AvatarImage src={a.photo} alt={a.name} />
                  ) : null}
                  <AvatarFallback>{a.name ? a.name[0].toUpperCase() : "?"}</AvatarFallback>
                </Avatar>
              ))}
              {extraAuthors > 0 && (
                <Avatar className={styles.extraAuthorsAvatar}>
                  <span className={styles.extraAuthorsCount}>{extraAuthors}</span>
                </Avatar>
              )}
            </div>
            <span className={styles.flexSpacer} />
            <span className={styles.dateText}>
              {date ? new Date(date).toLocaleDateString('pt-PT') : ''}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className={styles.postTitle}>{title}</div>
          <div
            className={styles.postDescription}
            dangerouslySetInnerHTML={{ __html: descriptionNoFormatting }}
          />
          <div className={styles.postTags}>
            {tags && tags.length > 0 && tags.map((tag, idx) => (
              <Badge key={idx} variant="default">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
