import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FaPlus, FaEdit } from 'react-icons/fa';
import React, { useState } from 'react';
import ManageAuthorsModal from './ManageAuthorsModal';

interface MemberControlsProps {
  memberView: boolean;
  setMemberView: (v: boolean) => void;
}

export default function MemberControls({ memberView, setMemberView }: MemberControlsProps) {
  const [showAuthorsModal, setShowAuthorsModal] = useState(false);
  return (
    <div className="flex flex-col gap-4 mb-6 w-full">
      <div className="flex flex-col items-center">
        <span className="text-sm text-muted-foreground select-none mb-1">
          {memberView ? 'Admin' : 'Visualizador'}
        </span>
        <Switch checked={memberView} onCheckedChange={setMemberView} className='mb-3'/>
      </div>
      {memberView && (
        <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-2 lg:gap-x-8 w-full">
          <Button
            className="flex items-center gap-2 text-sm cursor-pointer border border-gray-300 rounded px-3 py-2 bg-white text-gray-800 hover:bg-gray-100 transition w-full sm:w-auto"
            onClick={() => setShowAuthorsModal(true)}
          >
            <FaEdit className="w-4 h-4" />
            Gerir autores
          </Button>
          {showAuthorsModal && (
            <ManageAuthorsModal onClose={() => setShowAuthorsModal(false)} />
          )}
          <Link href="/blog/new" passHref legacyBehavior>
            <Button className="flex items-center gap-2 text-sm cursor-pointer border border-gray-300 rounded px-3 py-2 bg-white text-gray-800 hover:bg-gray-100 transition w-full sm:w-auto">
              <FaPlus className="w-4 h-4" />
              Nova publicação
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
