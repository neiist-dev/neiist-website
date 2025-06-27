import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { UserData } from '@/types/user';
import styles from '@/styles/components/admin/AdminDetailsModal.module.css';

interface AdminUserModalProps {
  user: UserData;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (user: UserData) => void;
}

export default function AdminUserModal({ user, isOpen, onClose, onUpdate }: AdminUserModalProps) {
  const [editedUser, setEditedUser] = useState<UserData>(user);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedUser(user);
    setPhotoPreview(user.photo || null);
    setIsEditing(false);
  }, [user]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 5 * 1024 * 1024 || !file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhotoPreview(result);
      setEditedUser({ ...editedUser, photo: result });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!onUpdate) return;
    setSaving(true);
    try {
      await onUpdate(editedUser);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRoleToggle = (role: string) => {
    const currentRoles = editedUser.roles || [];
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];
    setEditedUser({ ...editedUser, roles: newRoles });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  const formatDisplayDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className={styles.close}>×</button>
        
        <h2>{isEditing ? 'Edit User' : 'User Details'}</h2>
        
        <div className={styles.profile}>
          <div className={styles.photoContainer}>
            <Image
              src={photoPreview || editedUser.photo || '/default_user.png'}
              alt={editedUser.displayName}
              width={80}
              height={80}
              className={styles.avatar}
            />
            {isEditing && (
              <>
                <button onClick={() => fileInputRef.current?.click()} className={styles.photoButton}>
                  📷
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
              </>
            )}
          </div>
          
          <div>
            {isEditing ? (
              <input
                type="text"
                value={editedUser.displayName}
                onChange={(e) => setEditedUser({ ...editedUser, displayName: e.target.value })}
                className={styles.nameInput}
              />
            ) : (
              <h3>{editedUser.displayName}</h3>
            )}
            <p>@{editedUser.username}</p>
            <span className={`${styles.status} ${styles[editedUser.status.toLowerCase()]}`}>
              {editedUser.status}
            </span>
          </div>
        </div>

        <label>Email</label>
        <p>{editedUser.email || 'Not specified'}</p>
        
        <label>Campus</label>
        <p>{editedUser.campus || 'Not specified'}</p>

        {editedUser.courses && editedUser.courses.length > 0 && (
          <>
            <label>Courses</label>
            <div>
              {editedUser.courses.map((course, index) => (
                <span key={index} className={styles.tag}>{course}</span>
              ))}
            </div>
          </>
        )}

        <label>NEIIST Roles</label>
        {isEditing ? (
          <div>
            {['member', 'collaborator', 'admin'].map(role => (
              <label key={role} className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={editedUser.roles?.includes(role) || false}
                  onChange={() => handleRoleToggle(role)}
                />
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </label>
            ))}
          </div>
        ) : (
          <div>
            {editedUser.roles && editedUser.roles.length > 0 ? (
              editedUser.roles.map((role, index) => (
                <span key={index} className={styles.tag}>{role}</span>
              ))
            ) : (
              <p>No roles assigned</p>
            )}
          </div>
        )}

        {(editedUser.registerDate || editedUser.electorDate || isEditing) && (
          <>
            <label>Member Information</label>
            <div className={styles.dateGrid}>
              <div>
                <small>Register Date</small>
                {isEditing ? (
                  <input
                    type="date"
                    value={formatDate(editedUser.registerDate)}
                    onChange={(e) => setEditedUser({ ...editedUser, registerDate: e.target.value })}
                  />
                ) : (
                  <p>{formatDisplayDate(editedUser.registerDate)}</p>
                )}
              </div>
              <div>
                <small>Elector Date</small>
                {isEditing ? (
                  <input
                    type="date"
                    value={formatDate(editedUser.electorDate)}
                    onChange={(e) => setEditedUser({ ...editedUser, electorDate: e.target.value })}
                  />
                ) : (
                  <p>{formatDisplayDate(editedUser.electorDate)}</p>
                )}
              </div>
            </div>
          </>
        )}

        {(editedUser.fromDate || editedUser.toDate || isEditing) && (
          <>
            <label>Collaborator Period</label>
            <div className={styles.dateGrid}>
              <div>
                <small>From Date</small>
                {isEditing ? (
                  <input
                    type="date"
                    value={formatDate(editedUser.fromDate)}
                    onChange={(e) => setEditedUser({ ...editedUser, fromDate: e.target.value })}
                  />
                ) : (
                  <p>{formatDisplayDate(editedUser.fromDate)}</p>
                )}
              </div>
              <div>
                <small>To Date</small>
                {isEditing ? (
                  <input
                    type="date"
                    value={formatDate(editedUser.toDate)}
                    onChange={(e) => setEditedUser({ ...editedUser, toDate: e.target.value })}
                  />
                ) : (
                  <p>{formatDisplayDate(editedUser.toDate)}</p>
                )}
              </div>
            </div>
          </>
        )}

        {(typeof editedUser.renewalNotification !== 'undefined' || isEditing) && (
          <>
            <label>Renewal Notification</label>
            {isEditing ? (
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={editedUser.renewalNotification || false}
                  onChange={(e) => setEditedUser({ ...editedUser, renewalNotification: e.target.checked })}
                />
                Send renewal notification
              </label>
            ) : (
              <p>{editedUser.renewalNotification ? 'Yes' : 'No'}</p>
            )}
          </>
        )}

        {onUpdate && (
          <div className={styles.actions}>
            {isEditing ? (
              <>
                <button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={() => {
                  setEditedUser(user);
                  setPhotoPreview(user.photo || null);
                  setIsEditing(false);
                }}>
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)}>Edit User</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
