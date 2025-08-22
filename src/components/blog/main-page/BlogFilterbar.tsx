import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { UserRole } from '@/types/user';
import ManageTagsModal from './ManageTagsModal';
import { FaChevronLeft, FaEdit } from 'react-icons/fa';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

interface BlogFilterbarProps {
  open: boolean;
  onClose: () => void;
  onFilterChange?: (filters: string[]) => void;
}

const BlogFilterbar: React.FC<BlogFilterbarProps> = ({ open, onClose, onFilterChange }) => {
  const { user } = useUser();
  const isMember = user && user.roles?.includes(UserRole.MEMBER);
  const [selected, setSelected] = useState<string[]>([]);
  const [tagsByCategory, setTagsByCategory] = useState<Record<string, { id: number, name: string }[]>>({});
  const [loading, setLoading] = useState(true);
  const [showManageModal, setShowManageModal] = useState(false);
  
  
  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/blog/tags');
        const data = await res.json();
        setTagsByCategory(data);
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, []);
  const handleDeleteTag = async (id: number) => {
    await fetch('/api/blog/tags', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const res = await fetch('/api/blog/tags');
    const data = await res.json();
    setTagsByCategory(data);
  };

  // Eliminar categoria de tag
  const handleDeleteCategory = async (category: string) => {
    await fetch('/api/blog/tags', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category }),
    });
    const res = await fetch('/api/blog/tags');
    const data = await res.json();
    setTagsByCategory(data);
  };
  
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
        style={{ minWidth: '0', maxWidth: '100vw', overflow: 'hidden' }}
      >
        <div className="flex flex-col gap-2 px-6 py-4 mb-2 mt-3">
          <div className="flex items-center">
            <button
              className="p-2 rounded hover:bg-gray-100 transition-colors cursor-pointer mr-2"
              onClick={onClose}
            >
              <FaChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="font-semibold text-2xl tracking-tight mx-2">Filtros</span>
            <span className="text-sm text-gray-500 ml-2">({selected.length})</span>
          </div>
          {isMember && (
            <div className="flex justify-center w-full">
              <button
                className="my-3 px-16 py-1 border border-gray-300 rounded bg-white text-gray-800 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                onClick={() => setShowManageModal(true)}
              >
                <FaEdit className="w-4 h-4" />
                Gerir tags
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-center text-gray-400">A carregar tags...</div>
          ) : (
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 230px)' }}>
              {Object.entries(tagsByCategory).map(([category, tags]) => (
                <section key={category}>
                  <div className="flex items-center mb-2 mt-4 mx-3">
                    <h4 className="text-xl text-gray-700 capitalize">{category}</h4>
                  </div>
                  <div className="flex flex-col gap-2">
                    {tags.map(tag => (
                      <div key={tag.id} className="flex items-center gap-2 mx-3">
                        <Checkbox id={tag.name} checked={selected.includes(tag.name)} onClick={() => handleToggle(tag.name)} />
                        <label htmlFor={tag.name} className="text-sm cursor-pointer">
                          <Badge className="text-md px-2 py-0.5 bg-blue-100 text-blue-800">{tag.name}</Badge>
                        </label>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

      {isMember && showManageModal && (
        <div className="absolute left-0 top-0 w-full h-full bg-white z-50 flex flex-col p-0 border-r border-gray-200 shadow-2xl animate-fadeIn">
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <ManageTagsModal
              tagsByCategory={tagsByCategory}
              onCreate={async (tag, category) => {
                await fetch('/api/blog/tags', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: tag, category }),
                });
                const res = await fetch('/api/blog/tags');
                const data = await res.json();
                setTagsByCategory(data);
              }}
              onDeleteTag={handleDeleteTag}
              onDeleteCategory={handleDeleteCategory}
              onUpdateTag={async (id, name) => {
                await fetch(`/api/blog/tags/${id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name }),
                });
                const res = await fetch('/api/blog/tags');
                const data = await res.json();
                setTagsByCategory(data);
              }}
              onClose={() => setShowManageModal(false)}
            />
          </div>
        </div>
      )}
        </div>
        {selected.length > 0 && (
          <div className="px-8 pb-6 pt-2">
            <Button
              variant="outline"
              className="w-full text-medium px-4 py-2 cursor-pointer"
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
