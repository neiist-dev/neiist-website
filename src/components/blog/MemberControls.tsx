import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
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
        <Link href="/blog/new" passHref legacyBehavior>
          <a className="ml-4 flex items-center gap-2 text-sm cursor-pointer border border-gray-300 rounded px-3 py-2 bg-white text-gray-800 hover:bg-gray-100 transition">
            <FaPlus className="w-4 h-4" />
            Nova publicação
          </a>
        </Link>
      )}
    </div>
  );
}
