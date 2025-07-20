'use client';

import { useState, useEffect } from 'react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import PersonalInfoCard from '@/components/profile/PersonalInfoCard';
import { useUser } from '@/context/UserContext';
import { User, UserRole, mapRoleToUserRole } from '@/types/user';
import styles from '@/styles/pages/ProfilePage.module.css';

export default function ProfilePage() {
  const { user, setUser } = useUser();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    alternativeEmail: '',
    phone: '',
    preferredContactMethod: 'email' as 'email' | 'alternativeEmail' | 'phone',
    photo: ''
  });
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  const userRoles = user?.roles?.map(role => mapRoleToUserRole(role)) || [UserRole.GUEST];
  const canEditPhoto = userRoles.includes(UserRole.ADMIN);

  useEffect(() => {
    if (user) {
      setFormData({
        alternativeEmail: user.alternativeEmail || '',
        phone: user.phone || '',
        preferredContactMethod: (user.preferredContactMethod || 'email') as 'email' | 'alternativeEmail' | 'phone',
        photo: user.photo || ''
      });
      setPhotoPreview(null);
    }
  }, [user]);

  const handleFormChange = (field: string, value: string) => {
    if (field === 'preferredContactMethod') {
      const validMethods: Array<'email' | 'alternativeEmail' | 'phone'> = ['email', 'alternativeEmail', 'phone'];
      if (validMethods.includes(value as 'email' | 'alternativeEmail' | 'phone')) {
        setFormData(prev => ({ 
          ...prev, 
          [field]: value as 'email' | 'alternativeEmail' | 'phone'
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError('');

    if (!file) return;

    if (file.size > 5 * 1024 * 1024 || !file.type.startsWith('image/')) {
      setError('Invalid image, select a image file with less than 5 Mb.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
      setFormData(prev => ({ ...prev, photo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const updateData: Partial<User> = {
        alternativeEmail: formData.alternativeEmail,
        phone: formData.phone,
        preferredContactMethod: formData.preferredContactMethod
      };

      if (canEditPhoto && photoPreview) {
        updateData.photo = formData.photo;
      }

      const res = await fetch(`/api/user/update/${user?.istid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update');
      }

      if (user) {
        setUser({
          ...user,
          alternativeEmail: updateData.alternativeEmail,
          phone: updateData.phone,
          preferredContactMethod: updateData.preferredContactMethod,
          photo: photoPreview || user.photo
        });
      }

      setEditing(false);
    } catch (e) {
      console.error('Failed to update profile', e);
      setError(e instanceof Error ? e.message : 'Failed to update profile. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        alternativeEmail: user.alternativeEmail || '',
        phone: user.phone || '',
        preferredContactMethod: (user.preferredContactMethod || 'email') as 'email' | 'alternativeEmail' | 'phone',
        photo: user.photo || ''
      });
    }
    setPhotoPreview(null);
    setError('');
    setEditing(false);
  };

  if (!user) return <div>Carregando...</div>;

  return (
    <main className={styles.profileMain}>
      <section className={styles.profileCard}>
        <header className={styles.profileHeader}>
          <h1>Perfil</h1>
          {!editing && (
            <button className={styles.editBtn} onClick={() => setEditing(true)}>
              Editar Perfil
            </button>
          )}
        </header>

        <ProfileHeader
          user={{
            name: user.name,
            istid: user.istid,
            roles: user.roles || [],
            photo: user.photo
          }}
          photoPreview={photoPreview}
          editing={editing}
          onPhotoChange={handlePhotoChange}
          canEditPhoto={canEditPhoto}
        />

        {error && (
          <p className={styles.error}>
            {error}
          </p>
        )}

        <PersonalInfoCard
          user={user}
          editing={editing}
          formData={formData}
          onFormChange={handleFormChange}
        />

        {editing && (
          <div className={styles.actionRow}>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Guardar'}
            </button>
            <button className={styles.cancelBtn} onClick={handleCancel}>
              Cancelar
            </button>
          </div>
        )}
      </section>
    </main>
  );
}