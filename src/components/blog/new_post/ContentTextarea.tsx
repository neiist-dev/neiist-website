import React from 'react';

interface ContentTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const ContentTextarea: React.FC<ContentTextareaProps> = ({ value, onChange }) => (
  <textarea
    placeholder="Conteúdo..."
    value={value}
    onChange={onChange}
    className="w-full min-h-[120px] border-2 border-gray-300 rounded px-4 py-2 resize-y"
  />
);

export default ContentTextarea;
