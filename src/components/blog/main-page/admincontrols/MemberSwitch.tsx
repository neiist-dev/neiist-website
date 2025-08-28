import React from 'react';
import { Switch } from '@/components/ui/switch';
import styles from '@/styles/components/blog/mainpage/MemberControls.module.css';

interface MemberSwitchProps {
  memberView: boolean;
  setMemberView: (v: boolean) => void;
}

const MemberSwitch: React.FC<MemberSwitchProps> = ({ memberView, setMemberView }) => (
  <div className={styles.switchSection}>
    <span className={styles.switchLabel}>
      {memberView ? 'Admin' : 'Visualizador'}
    </span>
    <Switch checked={memberView} onCheckedChange={setMemberView} />
  </div>
);

export default MemberSwitch;
