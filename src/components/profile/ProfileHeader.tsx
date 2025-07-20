import { useRef } from 'react';
import Image from 'next/image';
import { FiCamera } from 'react-icons/fi';
import styles from '@/styles/components/profile/ProfileHeader.module.css';

interface ProfileHeaderProps {
  user: {
    name: string;
    istid: string;
    roles: string[];
    photo?: string;
  };
  photoPreview: string | null;
  editing: boolean;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  canEditPhoto: boolean;
}

export default function ProfileHeader({
  user,
  photoPreview,
  editing,
  onPhotoChange,
  canEditPhoto
}: ProfileHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.header}>
      <div className={styles.photoContainer}>
        <Image
          src={photoPreview || user.photo || '/default-profile.png'}
          alt="Profile"
          className={styles.photo}
          width={120}
          height={120}
        />
        {editing && canEditPhoto && (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={styles.photoBtn}
            >
              <FiCamera size={20} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onPhotoChange}
              style={{ display: 'none' }}
            />
          </>
        )}
      </div>
      
      <div className={styles.info}>
        <h2>{user.name}</h2>
        <p className={styles.istid}>{user.istid}</p>
        <p className={styles.roles}>{user.roles.join(', ')}</p>
      </div>
    </div>
  );
}
