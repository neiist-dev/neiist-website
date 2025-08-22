import React from 'react';
import { Button } from '@/components/ui/button';

interface CoverImageInputProps {
  image: File | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onButtonClick: () => void;
}

const CoverImageInput: React.FC<CoverImageInputProps> = ({ image, onChange, onButtonClick }) => (
  <div>
    <label className="block mb-1 text-s text-black">Foto de capa</label>
    <div className="flex items-center gap-3">
      <input
        id="file-input"
        type="file"
        accept="image/*"
        onChange={onChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="default"
        onClick={onButtonClick}
        className="mb-2 cursor-pointer"
      >
        Importar foto
      </Button>
      {image && <span className="text-sm text-gray-600 truncate max-w-[180px]">{image.name}</span>}
    </div>
  </div>
);

export default CoverImageInput;
