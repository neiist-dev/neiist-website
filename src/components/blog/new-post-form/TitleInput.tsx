import React from 'react';
import { Input } from '@/components/ui/input';

interface TitleInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const TitleInput: React.FC<TitleInputProps> = ({ value, onChange }) => (
  <div className="relative mb-2">
    <label className="absolute -top-6 text-s text-black select-none pr-1">Título</label>
    <Input
      type="text"
      placeholder="Insere aqui o título da notícia"
      value={value}
      onChange={onChange}
      className="text-lg px-3 py-2"
    />
  </div>
);

export default TitleInput;
