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
            className={`px-2.5 py-0.5 rounded font-medium border transition-colors cursor-pointer ${
              page === i + 1
                ? 'text-black border-transparent bg-[#2863FD] text-white hover:bg-[#2863FD]/90'
                : 'bg-muted text-foreground border-transparent hover:bg-[#2863FD]/10'
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
