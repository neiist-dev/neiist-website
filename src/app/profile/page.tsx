'use client';

import { useState, useEffect } from 'react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import PersonalInfoCard from '@/components/profile/PersonalInfoCard';
import NeiistRolesCard from '@/components/profile/RolesCard';
import { useAuthRedirect } from '@/utils/AuthRedirect';
import styles from '@/styles/pages/ProfilePage.module.css';

export default function ProfilePage() {
  const { user,isAuthorized } = useAuthRedirect({
    requireAuth: true
  });
  
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ displayName: '', photo: '' });
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string>('');

  useEffect(() => {
    if (user) {
      setFormData({ displayName: user.displayName || '', photo: user.photo || '' });
      setPhotoPreview(user.photo || null);
    }
  }, [user]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError(''); // Clear any previous error
    
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024 || !file.type.startsWith('image/')) {
      setImageError('Invalid image. Please select an image file under 5MB.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
      setFormData(f => ({ ...f, photo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleDisplayNameChange = (value: string) => {
    setFormData(f => ({ ...f, displayName: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const hasNameChange = formData.displayName !== user?.displayName;
      const hasPhotoChange = formData.photo !== user?.photo && formData.photo !== '';
      if (!hasNameChange && !hasPhotoChange) {
        setEditing(false);
        setSaving(false);
        return;
      }
      const res = await fetch('/api/user/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: hasNameChange ? formData.displayName : undefined,
          photo: hasPhotoChange ? formData.photo : undefined
        }),
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to update');
      setEditing(false);
      location.reload();
    } catch (e) {
      console.error('Failed to update profile', e);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({ displayName: user?.displayName || '', photo: user?.photo || '' });
    setPhotoPreview(user?.photo || null);
    setImageError('');
    setEditing(false);
  };

  if (!isAuthorized) return <div>Loading...</div>;
  if (!user) return null;

  return (
    <main className={styles.profileMain}>
      <section className={styles.profileCard}>
        <header className={styles.profileHeader}>
          <h1>Profile</h1>
          {!editing && (
            <button className={styles.editBtn} onClick={() => setEditing(true)}>
              Edit Profile
            </button>
          )}
        </header>
        <ProfileHeader
          user={user}
          photoPreview={photoPreview}
          editing={editing}
          onPhotoChange={handlePhotoChange}
          nameValue={formData.displayName}
          onNameChange={handleDisplayNameChange}
        />
        {imageError && (
          <p className={styles.imageError}>
            {imageError}
          </p>
        )}
        <PersonalInfoCard
          user={user}
          editing={editing}
        />
        <NeiistRolesCard user={user} />
        {editing && (
          <div className={styles.actionRow}>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button className={styles.cancelBtn} onClick={handleCancel}>
              Cancel
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
