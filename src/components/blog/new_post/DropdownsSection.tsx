import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface DropdownsSectionProps {
  authors: string[];
  selectedAuthor: string;
  onAuthorChange: (value: string) => void;
  onAddAuthor: () => void;
  tags: string[];
  selectedTags: string[];
  onTagsChange: (value: string[]) => void;
  onAddTag: () => void;
}

const DropdownsSection: React.FC<DropdownsSectionProps> = ({
  authors,
  selectedAuthor = "",
  onAuthorChange,
  onAddAuthor,
  tags,
  selectedTags = [],
  onTagsChange,
  onAddTag,
}) => {
    const [search, setSearch] = useState("");
    const filteredTags = tags.filter(tag => tag.toLowerCase().includes(search.toLowerCase()));

    return (
      <div className="flex gap-4 mb-2">

        <div className="flex flex-col w-full max-w-[300px]">
          <label className="block mb-1 text-s text-black">Autor</label>
          <Select value={selectedAuthor} onValueChange={onAuthorChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Escolher autor" className="truncate" />
            </SelectTrigger>
            <SelectContent>
              {authors.map((author) => (
                <SelectItem key={author} value={author}>{author}</SelectItem>
              ))}
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
              {filteredTags.length === 0 ? (
                <div className="px-2 py-2 text-sm text-muted-foreground">Nenhuma tag encontrada</div>
              ) : (
                filteredTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  const canSelectMore = selectedTags.length < 3;
                  return (
                    <div
                      key={tag}
                      className={`flex items-center px-2 py-1 cursor-pointer hover:bg-muted ${!isSelected && !canSelectMore ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={e => {
                        e.stopPropagation();
                        if (isSelected) {
                          onTagsChange(selectedTags.filter(t => t !== tag));
                        } else if (canSelectMore) {
                          onTagsChange([...selectedTags, tag]);
                        }
                      }}
                    >
                      <Checkbox checked={isSelected} className="mr-2" disabled={!isSelected && !canSelectMore} />
                      <span>{tag}</span>
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
