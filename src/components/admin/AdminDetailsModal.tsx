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

export default function AdminUserModal({ 
  user, 
  isOpen, 
  onClose, 
  onUpdate
}: AdminUserModalProps) {
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
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isEditing ? 'Edit User' : 'User Details'}
          </h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>

        <div className={styles.content}>
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
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={styles.photoButton}
                  >
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
            <div className={styles.info}>
              {isEditing ? (
                <input
                  type="text"
                  value={editedUser.displayName}
                  onChange={(e) => setEditedUser({ ...editedUser, displayName: e.target.value })}
                  className={styles.nameInput}
                />
              ) : (
                <h3 className={styles.name}>{editedUser.displayName}</h3>
              )}
              <p className={styles.username}>@{editedUser.username}</p>
              <span className={`${styles.status} ${styles[editedUser.status.toLowerCase()]}`}>
                {editedUser.status}
              </span>
            </div>
          </div>

          <div className={styles.details}>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <p className={styles.value}>{editedUser.email || 'Not specified'}</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Campus</label>
              <p className={styles.value}>{editedUser.campus || 'Not specified'}</p>
            </div>

            {editedUser.courses && editedUser.courses.length > 0 && (
              <div className={styles.field}>
                <label className={styles.label}>Courses</label>
                <div className={styles.tags}>
                  {editedUser.courses.map((course, index) => (
                    <span key={index} className={styles.courseTag}>{course}</span>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label}>NEIIST Roles</label>
              {isEditing ? (
                <div className={styles.roleEditor}>
                  {['member', 'collaborator', 'admin'].map(role => (
                    <label key={role} className={styles.checkbox}>
                      <input
                        type="checkbox"
                        checked={editedUser.roles?.includes(role) || false}
                        onChange={() => handleRoleToggle(role)}
                      />
                      <span>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className={styles.tags}>
                  {editedUser.roles && editedUser.roles.length > 0 ? (
                    editedUser.roles.map((role, index) => (
                      <span key={index} className={styles.roleTag}>{role}</span>
                    ))
                  ) : (
                    <p className={styles.noData}>No roles assigned</p>
                  )}
                </div>
              )}
            </div>

            {/* Member Information */}
            {(editedUser.registerDate || editedUser.electorDate || isEditing) && (
              <div className={styles.field}>
                <label className={styles.label}>Member Information</label>
                <div className={styles.dateGrid}>
                  <div className={styles.dateField}>
                    <label className={styles.dateLabel}>Register Date</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={formatDate(editedUser.registerDate)}
                        onChange={(e) => setEditedUser({ ...editedUser, registerDate: e.target.value })}
                        className={styles.dateInput}
                      />
                    ) : (
                      <p className={styles.dateValue}>{formatDisplayDate(editedUser.registerDate)}</p>
                    )}
                  </div>
                  <div className={styles.dateField}>
                    <label className={styles.dateLabel}>Elector Date</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={formatDate(editedUser.electorDate)}
                        onChange={(e) => setEditedUser({ ...editedUser, electorDate: e.target.value })}
                        className={styles.dateInput}
                      />
                    ) : (
                      <p className={styles.dateValue}>{formatDisplayDate(editedUser.electorDate)}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Collaborator Period */}
            {(editedUser.fromDate || editedUser.toDate || isEditing) && (
              <div className={styles.field}>
                <label className={styles.label}>Collaborator Period</label>
                <div className={styles.dateGrid}>
                  <div className={styles.dateField}>
                    <label className={styles.dateLabel}>From Date</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={formatDate(editedUser.fromDate)}
                        onChange={(e) => setEditedUser({ ...editedUser, fromDate: e.target.value })}
                        className={styles.dateInput}
                      />
                    ) : (
                      <p className={styles.dateValue}>{formatDisplayDate(editedUser.fromDate)}</p>
                    )}
                  </div>
                  <div className={styles.dateField}>
                    <label className={styles.dateLabel}>To Date</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={formatDate(editedUser.toDate)}
                        onChange={(e) => setEditedUser({ ...editedUser, toDate: e.target.value })}
                        className={styles.dateInput}
                      />
                    ) : (
                      <p className={styles.dateValue}>{formatDisplayDate(editedUser.toDate)}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Renewal Period */}
            {(editedUser.startRenewalDate || editedUser.endRenewalDate || isEditing) && (
              <div className={styles.field}>
                <label className={styles.label}>Renewal Period</label>
                <div className={styles.dateGrid}>
                  <div className={styles.dateField}>
                    <label className={styles.dateLabel}>Start Renewal</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={formatDate(editedUser.startRenewalDate)}
                        onChange={(e) => setEditedUser({ ...editedUser, startRenewalDate: e.target.value })}
                        className={styles.dateInput}
                      />
                    ) : (
                      <p className={styles.dateValue}>{formatDisplayDate(editedUser.startRenewalDate)}</p>
                    )}
                  </div>
                  <div className={styles.dateField}>
                    <label className={styles.dateLabel}>End Renewal</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={formatDate(editedUser.endRenewalDate)}
                        onChange={(e) => setEditedUser({ ...editedUser, endRenewalDate: e.target.value })}
                        className={styles.dateInput}
                      />
                    ) : (
                      <p className={styles.dateValue}>{formatDisplayDate(editedUser.endRenewalDate)}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Renewal Notification */}
            {(typeof editedUser.renewalNotification !== 'undefined' || isEditing) && (
              <div className={styles.field}>
                <label className={styles.label}>Renewal Notification</label>
                {isEditing ? (
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={editedUser.renewalNotification || false}
                      onChange={(e) => setEditedUser({ ...editedUser, renewalNotification: e.target.checked })}
                    />
                    <span>Send renewal notification</span>
                  </label>
                ) : (
                  <p className={styles.value}>{editedUser.renewalNotification ? 'Yes' : 'No'}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {onUpdate && (
          <div className={styles.footer}>
            {isEditing ? (
              <div className={styles.actions}>
                <button onClick={handleSave} disabled={saving} className={styles.saveButton}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={() => {
                  setEditedUser(user);
                  setPhotoPreview(user.photo || null);
                  setIsEditing(false);
                }} className={styles.cancelButton}>
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setIsEditing(true)} className={styles.editButton}>
                Edit User
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}