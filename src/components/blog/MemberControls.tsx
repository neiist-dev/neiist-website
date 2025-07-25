import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { FaPlus } from 'react-icons/fa';
import React from 'react';

interface MemberControlsProps {
  memberView: boolean;
  setMemberView: (v: boolean) => void;
}

export default function MemberControls({ memberView, setMemberView }: MemberControlsProps) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <span className="text-sm text-muted-foreground select-none">
        {memberView ? 'Admin' : 'Visualizador'}
      </span>
      <Switch checked={memberView} onCheckedChange={setMemberView} />
      {memberView && (
        <Button variant="outline" className="ml-4 flex items-center gap-2 text-sm cursor-pointer">
          <FaPlus className="w-1 h-1" />
          Nova publicação
        </Button>
      )}
    </div>
  );
}
