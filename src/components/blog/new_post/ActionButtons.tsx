import React from 'react';
import { Button } from '@/components/ui/button';

interface ActionButtonsProps {
  onSave: () => void;
  onUpdate?: () => void;
  saving: boolean;
  editMode?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onSave, onUpdate, saving, editMode }) => (
  <div className="flex justify-end mb-4">
    <Button variant="outline" className="w-full sm:w-auto self-end mr-2 cursor-pointer">
      Pré-visualizar
    </Button>
    {editMode ? (
      <Button onClick={onUpdate} disabled={saving} className="w-full sm:w-auto self-end mr-2 cursor-pointer">
        {saving ? 'A atualizar...' : 'Atualizar'}
      </Button>
    ) : (
      <Button onClick={onSave} disabled={saving} className="w-full sm:w-auto self-end mr-2 cursor-pointer">
        {saving ? 'A publicar...' : 'Publicar'}
      </Button>
    )}
  </div>
);

export default ActionButtons;
