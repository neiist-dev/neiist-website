import React from "react";

interface PaginationProps {
  page: number;
  pageCount: number;
  setPage: (page: number) => void;
}

export default function Pagination({ page, pageCount, setPage }: PaginationProps) {
  return (
    <div className="flex justify-center items-center gap-2 px-2 py-4 w-full">
      <button
        className="px-4 py-2 rounded bg-muted text-foreground disabled:opacity-50 transition-colors cursor-pointer"
        onClick={() => setPage(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        Anterior
      </button>
      <div className="flex gap-1">
        {Array.from({ length: pageCount }, (_, i) => (
          <button
            key={i}
            className={`px-3 py-1 rounded font-medium border transition-colors cursor-pointer ${
              page === i + 1
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted text-foreground border-transparent hover:border-muted-foreground'
            }`}
            onClick={() => setPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <button
        className="px-4 py-2 rounded bg-muted text-foreground disabled:opacity-50 transition-colors cursor-pointer"
        onClick={() => setPage(Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
      >
        Seguinte
      </button>
    </div>
  );
}
