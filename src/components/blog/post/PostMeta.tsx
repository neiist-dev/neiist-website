import React from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { FaRegCopy } from "react-icons/fa";

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
  const minutes = Math.ceil(words / 200); // average reading speed ~200 wpm

  console.log("Words: ", words);
  console.log("Minutes: ", minutes);

  return minutes;
}

  const readingTime = getReadingTime(content);


  const authorList: { name: string; photo?: string | null; email?: string | null }[] = Array.isArray(authors)
    ? authors.map(a => typeof a === 'string' ? { name: a } : { name: a.name, photo: a.photo, email: a.email })
    : [];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-muted-foreground w-full flex-wrap p-2">
      <div className="flex flex-col items-start gap-1 mb-2 sm:mb-0">
        <span className="text-xs text-gray-500 mr-2 mb-1">Artigo publicado por:</span>
        <div className="flex flex-row gap-2">
          {authorList.map((a, idx) => (
            <div key={a.name + idx} className="relative group">
              <Avatar 
                className="w-8 h-8 cursor-pointer transition-transform hover:scale-105" 
                onClick={() => handleCopyEmail(a.email)}
              >
                <AvatarImage src={a.photo || undefined} alt={a.name} />
                <AvatarFallback>{a.name ? a.name[0].toUpperCase() : "?"}</AvatarFallback>
              </Avatar>
              {/* Popup do autor */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-10">
                <div className="font-semibold">{a.name}</div>
                {a.email && (
                  <div className="text-xs text-gray-300">
                    {copiedEmail === a.email ? "Email copiado!" : a.email}
                  </div>
                )}
                {a.email && (
                  <div className="flex justify-center mt-1">
                    <FaRegCopy className="text-blue-300 w-4 h-4" title="Copiar email" />
                  </div>
                )}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
              </div>
            </div>
          ))}
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
