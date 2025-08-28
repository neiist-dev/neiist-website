import MemberSwitch from './MemberSwitch';
import ManageAuthorsButton from './ManageAuthorsButton';
import NewPublicationButton from './NewPublicationButton';
import React from 'react';
import styles from '@/styles/components/blog/mainpage/MemberControls.module.css';
import ManageTagsButton from './ManageTagsButton';

interface MemberControlsProps {
  memberView: boolean;
  setMemberView: (v: boolean) => void;
}

export default function MemberControls({ memberView, setMemberView }: MemberControlsProps) {
  return (
    <div className={styles.memberControls}>
      <MemberSwitch memberView={memberView} setMemberView={setMemberView} />
      {memberView && (
        <div className={styles.buttonGroup}>
          <ManageTagsButton />
          <ManageAuthorsButton />
          <NewPublicationButton />
        </div>
      )}
    </div>
  );
}
