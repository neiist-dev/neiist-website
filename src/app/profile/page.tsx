'use client';

import { useState, useEffect } from 'react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import PersonalInfoCard from '@/components/profile/PersonalInfoCard';
import NeiistRolesCard from '@/components/profile/RolesCard';
import { useAuthRedirect } from '@/utils/AuthRedirect';
import styles from '@/styles/pages/UserPage.module.css';

export default function ProfilePage() {
  const { user,isAuthorized } = useAuthRedirect({
    requireAuth: true
  });
  
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ displayName: '', photo: '' });
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({ displayName: user.displayName || '', photo: user.photo || '' });
      setPhotoPreview(user.photo || null);
    }
  }, [user]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024 || !file.type.startsWith('image/')) {
      console.error('Invalid image');
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
    setEditing(false);
  };

  if (!isAuthorized) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Profile</h1>
            {!editing && (
              <button onClick={() => setEditing(true)} className={styles.editButton}>
                Edit Profile
              </button>
            )}
          </div>

          <div className={styles.formContainer}>
            <ProfileHeader
              user={user}
              photoPreview={photoPreview}
              editing={editing}
              onPhotoChange={handlePhotoChange}
            />

            <PersonalInfoCard
              user={user}
              editing={editing}
              formData={formData}
              onDisplayNameChange={handleDisplayNameChange}
            />

            <NeiistRolesCard user={user} />

            {editing && (
              <div className={styles.buttonContainer}>
                <button 
                  onClick={handleSave} 
                  disabled={saving} 
                  className={styles.saveButton}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={handleCancel} className={styles.cancelButton}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}