import React from 'react';
import { FaSearch } from 'react-icons/fa';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"

interface BlogToolbarProps {
  onFilterClick: () => void;
  onSearch: (query: string) => void;
}

async function handleAddPost() {
  try {
    const res = await fetch('/api/blog', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Novo Post',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        date: new Date().toISOString().split('T')[0],
        author: 'Francisca Almeida',
        tags: ['geral', 'posts'],
        image: ''
      }),
    });
    if (!res.ok) throw new Error('Erro');
    alert('Adicionada');
  } catch (err) {
    alert('Erro');
  }
}

const BlogToolbar: React.FC<BlogToolbarProps> = ({ onFilterClick, onSearch }) => {
  const [search, setSearch] = React.useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    onSearch(value);
  };

  return (
    <div className="flex justify-center w-full px-6 sm:px-0">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full max-w-2xl">
        <Button variant="secondary" onClick={handleAddPost} className="w-full sm:w-auto mb-2 sm:mb-0 cursor-pointer">Adicionar Post</Button>
        <Button variant="default" onClick={onFilterClick} className="cursor-pointer w-full sm:w-auto mb-2 sm:mb-0">Filtros</Button>
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-800" />
          <Input
            type="text"
            placeholder="Pesquisar por artigos..."
            className="pl-10 w-full border-2 border-gray-300 min-w-0 bg-white"
            value={search}
            onChange={handleInputChange}
          />
        </div>
      </div>
    </div>
  );
};

export default BlogToolbar;
