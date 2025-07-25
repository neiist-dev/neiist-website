import React from 'react';
import { FaSearch } from 'react-icons/fa';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"

async function handleAddPost() {
  try {
    const res = await fetch('/api/blog', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Post de Exemplo',
        description: 'Descrição de exemplo para o post. Descrição de exemplo para o post. Descrição de exemplo para o post. Descrição de exemplo para o post. Descrição de exemplo para o post. Descrição de exemplo para o post.',
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

interface BlogToolbarProps {
  onFilterClick: () => void;
}


const BlogToolbar: React.FC<BlogToolbarProps> = ({ onFilterClick }) => (
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
        />
      </div>
    </div>
  </div>
);

export default BlogToolbar;
