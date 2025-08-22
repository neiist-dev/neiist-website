import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface DropdownsSectionProps {
  authors: string[];
  selectedAuthors: string[];
  onAuthorsChange: (value: string[]) => void;
  onAddAuthor: () => void;
  tagsByCategory: Record<string, { id: string, name: string }[]>;
  selectedTags: string[];
  onTagsChange: (value: string[]) => void;
  onAddTag: () => void;
}

const DropdownsSection: React.FC<DropdownsSectionProps> = ({
  authors,
  selectedAuthors = [],
  onAuthorsChange,
  onAddAuthor,
  tagsByCategory,
  selectedTags = [],
  onTagsChange,
  onAddTag,
}) => {
  const [search, setSearch] = useState("");

    return (
      <div className="flex gap-4 mb-2">

        <div className="flex flex-col w-full max-w-[300px]">
          <label className="block mb-1 text-s text-black">Autores</label>
          <Select
            value={selectedAuthors.join(',')}
            onValueChange={() => {}}
            open={undefined}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Escolher autores" className="truncate">
                {selectedAuthors.length ? selectedAuthors.join(', ') : ''}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="min-h-[120px] max-h-[220px] overflow-y-auto">
              {authors.map((author) => {
                const isSelected = selectedAuthors.includes(author);
                return (
                  <div
                    key={author}
                    className={`flex items-center px-2 py-1 cursor-pointer hover:bg-muted`}
                    onClick={e => {
                      e.stopPropagation();
                      if (isSelected) {
                        onAuthorsChange(selectedAuthors.filter(a => a !== author));
                      } else {
                        onAuthorsChange([...selectedAuthors, author]);
                      }
                    }}
                  >
                    <Checkbox checked={isSelected} className="mr-2" />
                    <span>{author}</span>
                  </div>
                );
              })}
            </SelectContent>
          </Select>
          <Button type="button" variant="default" className="mt-2 w-full cursor-pointer" onClick={onAddAuthor}>
            Adicionar autor
          </Button>
        </div>

        <div className="flex flex-col w-full max-w-[300px]">
          <label className="block mb-1 text-s text-black">Tags</label>
          <Select
            value={selectedTags.length ? selectedTags.join(',') : ''}
            onValueChange={() => {}}
            open={undefined}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Escolher tags" className="truncate">
                {selectedTags.length ? selectedTags.join(', ') : ''}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="min-h-[320px] max-h-[320px] overflow-y-auto">
              <div className="px-2 py-2 sticky top-0 bg-white z-20">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Pesquisar tag..."
                  className="w-full px-2 py-1 mb-2 border rounded text-sm"
                  autoFocus
                />
              </div>
              {Object.entries(tagsByCategory).length === 0 ? (
                <div className="px-2 py-2 text-sm text-muted-foreground">Nenhuma tag encontrada</div>
              ) : (
                Object.entries(tagsByCategory).map(([category, tags]) => {
                  const filtered = (tags as { id: string; name: string }[]).filter((tag) => tag.name.toLowerCase().includes(search.toLowerCase()));
                  if (filtered.length === 0) return null;
                  return (
                    <div key={category} className="mb-2">
                      <div className="font-semibold text-xs text-gray-500 px-2 py-1 uppercase">{category}</div>
                      {filtered.map((tag: { id: string; name: string }) => {
                        const isSelected = selectedTags.includes(tag.name);
                        const canSelectMore = selectedTags.length < 3;
                        return (
                          <div
                            key={tag.id}
                            className={`flex items-center px-2 py-1 cursor-pointer hover:bg-muted ${!isSelected && !canSelectMore ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={e => {
                              e.stopPropagation();
                              if (isSelected) {
                                onTagsChange(selectedTags.filter(t => t !== tag.name));
                              } else if (canSelectMore) {
                                onTagsChange([...selectedTags, tag.name]);
                              }
                            }}
                          >
                            <Checkbox checked={isSelected} className="mr-2" disabled={!isSelected && !canSelectMore} />
                            <span>{tag.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </SelectContent>
          </Select>
          <Button type="button" variant="default" className="mt-2 w-full cursor-pointer" onClick={onAddTag}>
            Adicionar tag
          </Button>
        </div>
      </div>
    );
};

export default DropdownsSection;
