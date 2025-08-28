import React from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { FaRegCopy } from "react-icons/fa";
import styles from '@/styles/components/blog/post/PostMeta.module.css';

interface AuthorMeta {
  name: string;
  photo?: string | null;
  email?: string | null;
}

interface PostMetaProps {
  authors?: (string | AuthorMeta)[];
  date?: string;
  tags?: string[];
  content?: string;
}

export default function PostMeta({ authors = [], date, tags = [], content }: PostMetaProps) {
  const [copiedEmail, setCopiedEmail] = React.useState<string | null>(null);
  
  const handleCopyEmail = async (email: string | null | undefined) => {
    if (email) {
      try {
        await navigator.clipboard.writeText(email);
        setCopiedEmail(email);
        setTimeout(() => setCopiedEmail(null), 2000);
      } catch (err) {
        console.error('Failed to copy email:', err);
      }
    }
  };

  function getReadingTime(text?: string) {
  if (!text || !text.trim()) return 0;

  // Remove HTML tags and collapse multiple spaces
  const plain = text
    .replace(/<[^>]*>/g, " ") // remove HTML tags
    .replace(/\s+/g, " ") // collapse spaces
    .trim();

  const words = plain.split(" ").filter(Boolean).length;
  const minutes = Math.ceil(words / 200);

  console.log("Words: ", words);
  console.log("Minutes: ", minutes);

  return minutes;
}

  const readingTime = getReadingTime(content);


  const authorList: { name: string; photo?: string | null; email?: string | null }[] = Array.isArray(authors)
    ? authors.map(a => typeof a === 'string' ? { name: a } : { name: a.name, photo: a.photo, email: a.email })
    : [];

  return (
    <div className={styles.meta}>
      <div className={styles.authorBlock}>
        <span className={styles.authorLabel}>Artigo publicado por:</span>
        <div className={styles.authorList}>
          {authorList.map((a, idx) => (
            <div key={a.name + idx} className={styles.authorItem}>
              <Avatar
                className={styles.avatar}
                onClick={() => handleCopyEmail(a.email)}
              >
                <AvatarImage src={a.photo || undefined} alt={a.name} />
                <AvatarFallback>{a.name ? a.name[0].toUpperCase() : "?"}</AvatarFallback>
              </Avatar>
              <div className={styles.authorPopup + ' author-popup'}>
                <div className={styles.authorName}>{a.name}</div>
                {a.email && (
                  <div className={styles.authorEmail}>
                    {copiedEmail === a.email ? "Email copiado!" : a.email}
                  </div>
                )}
                {a.email && (
                  <div className={styles.copyIconWrap}>
                    <FaRegCopy className={styles.copyIcon} title="Copiar email" />
                  </div>
                )}
                <div className={styles.authorPopupArrow}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className={styles.readingTime}>
        {readingTime < 1 ? "< 1 min" : `~ ${readingTime} min`}
      </span>
      <div className={styles.metaInfo}>
        <span>{date ? new Date(date).toLocaleDateString('pt-PT') : ''}</span>
        <div className={styles.tagsList}>
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className={styles.tagBadge}>
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
