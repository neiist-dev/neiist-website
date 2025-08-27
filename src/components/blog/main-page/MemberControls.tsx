import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FaPlus, FaEdit } from 'react-icons/fa';
import React, { useState } from 'react';
import ManageAuthorsModal from './manageauthors/ManageAuthorsModal';
import styles from '@/styles/components/blog/mainpage/MemberControls.module.css';

interface MemberControlsProps {
  memberView: boolean;
  setMemberView: (v: boolean) => void;
}

export default function MemberControls({ memberView, setMemberView }: MemberControlsProps) {
  const [showAuthorsModal, setShowAuthorsModal] = useState(false);
  return (
    <div className={styles.memberControls}>
      <div className={styles.switchSection}>
        <span className={styles.switchLabel}>
          {memberView ? 'Admin' : 'Visualizador'}
        </span>
        <Switch checked={memberView} onCheckedChange={setMemberView} />
      </div>
      {memberView && (
        <div className={styles.buttonGroup}>
          <Button
            className={styles.actionButton}
            onClick={() => setShowAuthorsModal(true)}
          >
            <FaEdit />
            Gerir autores
          </Button>
          {showAuthorsModal && (
            <ManageAuthorsModal onClose={() => setShowAuthorsModal(false)} />
          )}
          <Link href="/blog/new" passHref legacyBehavior>
            <Button className={styles.actionButton}>
              <FaPlus />
              Nova publicação
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
