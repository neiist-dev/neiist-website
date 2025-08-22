import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ActionButtonsProps {
  onSave: () => void;
  onUpdate?: () => void;
  saving: boolean;
  editMode?: boolean;
  onPreview?: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onSave, onUpdate, saving, editMode, onPreview }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState<'save' | 'update' | null>(null);

  const handleClick = (type: 'save' | 'update') => {
    setActionType(type);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    if (actionType === 'save') onSave();
    if (actionType === 'update' && onUpdate) onUpdate();
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setActionType(null);
  };

  return (
    <div className="flex justify-end mb-4">
      <Button variant="outline" className="w-full sm:w-auto self-end mr-2 cursor-pointer" onClick={onPreview}>
        Pré-visualizar
      </Button>
      {editMode ? (
        <Button onClick={() => handleClick('update')} disabled={saving} className="w-full sm:w-auto self-end mr-2 cursor-pointer">
          {saving ? 'A atualizar...' : 'Atualizar'}
        </Button>
      ) : (
        <Button onClick={() => handleClick('save')} disabled={saving} className="w-full sm:w-auto self-end mr-2 cursor-pointer">
          {saving ? 'A publicar...' : 'Publicar'}
        </Button>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="relative flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-lg p-6 min-w-[300px] flex flex-col items-center">
              <span className="mb-4 text-lg font-semibold text-gray-800">
                {actionType === 'save' ? 'Confirmar publicação?' : 'Confirmar atualização?'}
              </span>
              <div className="flex gap-4">
                <Button variant="outline" onClick={handleCancel} className="px-4 cursor-pointer">Cancelar</Button>
                <Button onClick={handleConfirm} className="px-4 cursor-pointer" autoFocus>Confirmar</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionButtons;
