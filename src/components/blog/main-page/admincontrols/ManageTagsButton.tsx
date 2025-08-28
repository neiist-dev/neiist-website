import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FaTags } from 'react-icons/fa';
import styles from '@/styles/components/blog/mainpage/MemberControls.module.css';
import ManageTagsModal from '../managetags/ManageTagsModal';

const ManageTagsButton: React.FC = () => {
  const [showTagsModal, setShowTagsModal] = useState(false);
  return (
    <>
      <Button
        className={styles.actionButton}
        onClick={() => setShowTagsModal(true)}
      >
        <FaTags />
        Gerir tags
      </Button>
      {showTagsModal && <ManageTagsModal onClose={() => setShowTagsModal(false)} />}
    </>
  );
};

export default ManageTagsButton;
