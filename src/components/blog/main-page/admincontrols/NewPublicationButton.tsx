import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FaPlus } from 'react-icons/fa';
import styles from '@/styles/components/blog/mainpage/MemberControls.module.css';

const NewPublicationButton: React.FC = () => (
  <Link href="/blog/new" passHref legacyBehavior>
    <Button className={styles.actionButton}>
      <FaPlus />
      Nova publicação
    </Button>
  </Link>
);

export default NewPublicationButton;
