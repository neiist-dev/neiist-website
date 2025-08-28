import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FaEdit } from 'react-icons/fa';
import ManageAuthorsModal from '../manageauthors/ManageAuthorsModal';
import styles from '@/styles/components/blog/mainpage/MemberControls.module.css';

const ManageAuthorsButton: React.FC = () => {
  const [showAuthorsModal, setShowAuthorsModal] = useState(false);
  return (
    <>
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
    </>
  );
};

export default ManageAuthorsButton;
