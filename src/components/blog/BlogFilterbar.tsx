
import React, { useState } from 'react';
import { FaChevronLeft } from 'react-icons/fa';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

interface BlogFilterbarProps {
  open: boolean;
  onClose: () => void;
  onFilterChange?: (filters: string[]) => void;
}


const EVENTOS_DEFAULT = ["workshops", "recrutamento", "posts"];
const ENTREVISTAS_DEFAULT = ["Sonae", "Farfetch", "OutSystems"];


const BlogFilterbar: React.FC<BlogFilterbarProps> = ({ open, onClose, onFilterChange }) => {
  const [selected, setSelected] = useState<string[]>([]);

  const handleToggle = (tag: string) => {
    let newSelected;
    if (selected.includes(tag)) {
      newSelected = selected.filter(t => t !== tag);
    } else {
      newSelected = [...selected, tag];
    }
    setSelected(newSelected);
    onFilterChange?.(newSelected);
  };

  return (
    <>
      <aside
        className={`fixed top-0 left-0 h-full w-72 max-w-full sm:w-72 sm:min-w-[18rem] sm:max-w-[18rem] bg-white z-[9999] shadow-2xl border-r border-gray-200 transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : '-translate-x-full sm:-translate-x-80'}`}
        style={{ minWidth: '0', maxWidth: '100vw' }}
      >
        <div className="flex flex-col gap-2 px-6 py-4 border-b border-gray-200 mb-2 mt-3">
          <div className="flex items-center">
            <button
              className="p-2 rounded hover:bg-gray-100 transition-colors cursor-pointer mr-2"
              onClick={onClose}
            >
              <FaChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="font-semibold text-2xl tracking-tight">Filtros</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 flex flex-col">
          <section>
            <h4 className="text-xl mb-4 text-gray-700">Eventos</h4>
            <div className="flex flex-col gap-2">
              {EVENTOS_DEFAULT.map(tag => (
                <div key={tag} className="flex items-center gap-2">
                  <Checkbox id={tag} checked={selected.includes(tag)} onClick={() => handleToggle(tag)} />
                  <label htmlFor={tag} className="text-sm cursor-pointer">
                    <Badge className="text-md px-2 py-0.5">{tag}</Badge>
                  </label>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h4 className="text-xl mb-4 text-gray-700">Empresas</h4>
            <div className="flex flex-col gap-2">
              {ENTREVISTAS_DEFAULT.map(tag => (
                <div key={tag} className="flex items-center gap-2">
                  <Checkbox id={tag} checked={selected.includes(tag)} onClick={() => handleToggle(tag)} />
                  <label htmlFor={tag} className="text-sm cursor-pointer">
                    <Badge variant="secondary" className="text-md px-2 py-0.5">{tag}</Badge>
                  </label>
                </div>
              ))}
            </div>
          </section>
        </div>
        {selected.length > 0 && (
          <div className="px-8 pb-10 pt-2">
            <Button
              variant="outline"
              className="w-full text-medium px-4 py-2"
              onClick={() => { setSelected([]); onFilterChange?.([]); }}
            >
              Limpar filtros
            </Button>
          </div>
        )}
      </aside>
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-[9998]"
          onClick={onClose}
        />
      )}
    </>
  );
};

export default BlogFilterbar;
