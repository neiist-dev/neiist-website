import { useRef } from 'react';
import Image from 'next/image';
import { FiCamera } from 'react-icons/fi';
import styles from '@/styles/components/profile/ProfileHeader.module.css';

interface ProfileHeaderProps {
  user: {
    displayName?: string;
    username: string;
    status: string;
    photo?: string;
  };
  photoPreview: string | null;
  editing: boolean;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  nameValue?: string;
  onNameChange?: (val: string) => void;
}

export default function ProfileHeader({
  user,
  photoPreview,
  editing,
  onPhotoChange,
  nameValue,
  onNameChange,
}: ProfileHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.profileSection}>
      <div className={styles.photoContainer}>
        <Image
          src={photoPreview || user.photo || '/default_user.png'}
          alt="Profile"
          className={styles.profileImage}
          width={120}
          height={120}
          style={{ objectFit: 'cover' }}
        />
        {editing && (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={styles.photoIconBtn}
              aria-label="Change photo"
            >
              <FiCamera size={20} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onPhotoChange}
              className={styles.hiddenInput}
            />
          </>
        )}
      </div>
      <div className={styles.userInfo}>
        {editing ? (
          <input
            type="text"
            value={nameValue ?? ''}
            onChange={e => onNameChange?.(e.target.value)}
            className={styles.input}
            placeholder="Name"
          />
        ) : (
          <h2>{user.displayName}</h2>
        )}
        <p className={styles.username}>{user.username}</p>
        <p className={styles.status}>{user.status}</p>
      </div>
    </div>
  );
}
