import React from 'react';
import { FaSearch } from 'react-icons/fa';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"

interface BlogToolbarProps {
  onFilterClick: () => void;
}

const BlogToolbar: React.FC<BlogToolbarProps> = ({ onFilterClick }) => (
  <div className="flex justify-center w-full mb-4">
    <div className="flex items-center gap-4 w-full max-w-2xl">
      <Button variant="default" onClick={onFilterClick} className='cursor-pointer'>Filtros</Button>
      <div className="relative flex-1">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-800" />
        <Input
          type="text"
          placeholder="Pesquisar por artigos..."
          className="pl-10 w-full border-2 border-gray-400"
        />
      </div>
    </div>
  </div>
);

export default BlogToolbar;
