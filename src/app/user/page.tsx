'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fetchUserData } from '@/utils/userUtils';
import { UserData } from '@/types/user';
import styles from '@/styles/pages/UserPage.module.css';

interface ExtendedUserData extends UserData {
  roles?: string[];
  teams?: string[];
  position?: string;
  registerDate?: string;
  electorDate?: string;
  fromDate?: string;
  toDate?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<ExtendedUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ displayName: '', photo: '' });
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const userData = await fetchUserData();
        if (!userData) return router.push('/api/auth/login');
        
        // Fetch additional role information
        const roleResponse = await fetch('/api/user/roles', {
          credentials: 'include'
        });
        
        let extendedUserData: ExtendedUserData = userData;
        
        if (roleResponse.ok) {
          const roleData = await roleResponse.json();
          extendedUserData = {
            ...userData,
            roles: roleData.roles || [],
            teams: roleData.teams || [],
            position: roleData.position,
            registerDate: roleData.registerDate,
            electorDate: roleData.electorDate,
            fromDate: roleData.fromDate,
            toDate: roleData.toDate
          };
        }
        
        setUser(extendedUserData);
        setFormData({ displayName: extendedUserData.displayName || '', photo: extendedUserData.photo || '' });
        setPhotoPreview(extendedUserData.photo || null);
      } catch (err) {
        console.error('Failed to fetch user data', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

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

  const formatTeamName = (team: string) => {
    return team.includes('COOR-') ? `Coordinator - ${team.replace('COOR-', '')}` : team;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) return <div className={styles.loadingContainer}><div className={styles.loadingText}>Loading profile...</div></div>;
  if (!user) return <div className={styles.errorContainer}><div className={styles.errorText}>Failed to load profile</div></div>;

  // Check if user has any NEIIST roles
  const hasNeiistRoles = user.roles && user.roles.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Profile</h1>
            {!editing && <button onClick={() => setEditing(true)} className={styles.editButton}>Edit Profile</button>}
          </div>
          <div className={styles.formContainer}>
            <div className={styles.profileSection}>
              <div className={styles.photoContainer}>
                <img src={photoPreview || user.photo || '/default_user.png'} alt="Profile" className={styles.profileImage} />
                {editing && (
                  <>
                    <button onClick={() => fileInputRef.current?.click()} className={styles.photoButton}>Change</button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className={styles.hiddenInput} />
                  </>
                )}
              </div>
              <div className={styles.userInfo}>
                <h2>{user.displayName}</h2>
                <p className={styles.username}>{user.username}</p>
                <p className={styles.status}>{user.status}</p>
              </div>
            </div>
            
            <div className={styles.fieldsGrid}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Name</label>
                {editing ? (
                  <input type="text" value={formData.displayName} onChange={e => setFormData(f => ({ ...f, displayName: e.target.value }))} className={styles.input} />
                ) : (
                  <p className={styles.readOnlyText}>{user.displayName || 'Not specified'}</p>
                )}
              </div>
              
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Email</label>
                <p className={styles.readOnlyText}>{user.email || 'Not specified'}</p>
                <p className={styles.helpText}>Email cannot be changed</p>
              </div>
              
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Campus</label>
                <p className={styles.readOnlyText}>{user.campus || 'Not specified'}</p>
                <p className={styles.helpText}>Campus cannot be changed</p>
              </div>
              
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Courses</label>
                <div className={styles.coursesContainer}>
                  {user.courses?.length ? user.courses.map((c, i) => <p key={i} className={styles.courseItem}>{c}</p>) : <p className={styles.noCourses}>No courses registered</p>}
                </div>
              </div>
            </div>

            {/* NEIIST Roles Section - Only show if user has roles */}
            {hasNeiistRoles && (
              <div className={styles.neiistSection}>
                <h3 className={styles.sectionTitle}>NEIIST Roles</h3>
                <div className={styles.rolesGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Current Roles</label>
                    <div className={styles.rolesContainer}>
                      {user.roles?.map((role, index) => (
                        <span key={index} className={`${styles.roleTag} ${styles[role]}`}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {user.teams && user.teams.length > 0 && (
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Team Roles</label>
                      <div className={styles.teamsContainer}>
                        {user.teams.map((team, index) => (
                          <span key={index} className={`${styles.teamTag} ${team.includes('COOR-') ? styles.coordinatorTag : styles.memberTag}`}>
                            {formatTeamName(team)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {user.position && (
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Position</label>
                      <p className={styles.readOnlyText}>{user.position}</p>
                    </div>
                  )}

                  {user.registerDate && (
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Member Since</label>
                      <p className={styles.readOnlyText}>{formatDate(user.registerDate)}</p>
                    </div>
                  )}

                  {user.fromDate && user.toDate && (
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Collaborator Period</label>
                      <p className={styles.readOnlyText}>
                        {formatDate(user.fromDate)} - {formatDate(user.toDate)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {editing && (
              <div className={styles.buttonContainer}>
                <button onClick={handleSave} disabled={saving} className={styles.saveButton}>{saving ? 'Saving...' : 'Save Changes'}</button>
                <button onClick={() => { setFormData({ displayName: user.displayName || '', photo: user.photo || '' }); setPhotoPreview(user.photo || null); setEditing(false); }} className={styles.cancelButton}>Cancel</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}