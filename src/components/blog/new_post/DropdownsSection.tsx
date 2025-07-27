import React from 'react';
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
    return (
      <div className="flex gap-4 mb-2">

        <div className="flex-1 flex flex-col">
          <label className="block mb-1 text-s text-black">Autor</label>
          <Select value={selectedAuthor} onValueChange={onAuthorChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Escolher autor" />
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

        <div className="flex-1 flex flex-col">
          <label className="block mb-1 text-s text-black">Tags</label>
          <Select
            value={selectedTags.length ? selectedTags.join(',') : ''}
            onValueChange={() => {}}
            open={undefined}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Escolher tags">
                {selectedTags.length ? selectedTags.join(', ') : ''}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center px-2 py-1 cursor-pointer hover:bg-muted"
                  onClick={e => {
                    e.stopPropagation();
                    if (selectedTags.includes(tag)) {
                      onTagsChange(selectedTags.filter(t => t !== tag));
                    } else {
                      onTagsChange([...selectedTags, tag]);
                    }
                  }}
                >
                  <Checkbox checked={selectedTags.includes(tag)} className="mr-2" />
                  <span>{tag}</span>
                </div>
              ))}
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
