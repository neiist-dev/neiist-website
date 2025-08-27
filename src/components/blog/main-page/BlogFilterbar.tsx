import React, { useState, useEffect } from 'react';
import styles from '@/styles/components/blog/mainpage/BlogFilterBar.module.css';
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
      <aside className={`${styles.filterbar} ${open ? styles.filterbarOpen : ''}`}>
        <div className={styles.filterbarHeader}>
          <button className={styles.filterbarClose} onClick={onClose}>
            <FaChevronLeft />
          </button>
          <span className={styles.filterbarTitle}>Filtros</span>
          <span>({selected.length})</span>
        </div>
        {!isMember && (
          <div>
            <button className={styles.filterbarClose} onClick={() => setShowManageModal(true)}>
              <FaEdit /> Gerir tags
            </button>
          </div>
        )}
        <div>
          {loading ? (
            <div className={styles.loading}>A carregar tags...</div>
          ) : (
            <div className={styles.scrollArea}>
              {Object.entries(tagsByCategory).map(([category, tags]) => (
                <section key={category}>
                  <div className={styles.category}>{category}</div>
                  <div>
                    {tags.map(tag => (
                      <div key={tag.id} className={styles.tag}>
                        <Checkbox id={tag.name} checked={selected.includes(tag.name)} onClick={() => handleToggle(tag.name)} />
                        <label htmlFor={tag.name}>
                          <Badge>{tag.name}</Badge>
                        </label>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
        {!isMember && showManageModal && (
          <div>
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
        )}
        {selected.length > 0 && (
          <div>
            <Button
              variant="outline"
              className={styles.clearButton}
              onClick={() => { setSelected([]); onFilterChange?.([]); }}
            >
              Limpar filtros
            </Button>
          </div>
        )}
      </aside>
      {open && (
        <div className={styles.filterbarOverlay} onClick={onClose} />
      )}
    </>
  );
};

export default BlogFilterbar;
