import { useState, useEffect } from 'react';
import styles from '@/styles/components/admin/UserDetailsModal.module.css';

interface TeamRole {
  value: string;
  label: string;
  isCoordinator: boolean;
}

interface User {
  username: string;
  displayName: string;
  email?: string;
  status: string;
  campus?: string;
  photo: string;
  courses?: string[];
  roles?: string[];
  teams?: string[] | string; // Can be array or string from DB
  position?: string;
  registerDate?: string;
  electorDate?: string;
  fromDate?: string;
  toDate?: string;
}

interface UserDetailsModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (user: User) => void;
  isAdmin: boolean;
}

export default function UserDetailsModal({ 
  user, 
  isOpen, 
  onClose, 
  onUpdate, 
  isAdmin 
}: UserDetailsModalProps) {
  const [editedUser, setEditedUser] = useState<User>(user);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availableTeamRoles, setAvailableTeamRoles] = useState<TeamRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Helper function to ensure teams is always an array
  const normalizeTeams = (teams: string[] | string | undefined): string[] => {
    if (!teams) return [];
    if (Array.isArray(teams)) return teams;
    if (typeof teams === 'string') {
      // Handle PostgreSQL array format like "{DEV,COOR-FOTO}"
      if (teams.startsWith('{') && teams.endsWith('}')) {
        return teams.slice(1, -1).split(',').filter(t => t.trim().length > 0);
      }
      // Handle single string
      return [teams];
    }
    return [];
  };

  // Helper function to get normalized teams for current user
  const getUserTeams = (): string[] => {
    return normalizeTeams(editedUser.teams);
  };

  useEffect(() => {
    setEditedUser({
      ...user,
      teams: normalizeTeams(user.teams)
    });
    setIsEditing(false);
  }, [user]);

  useEffect(() => {
    if (isAdmin && isEditing) {
      loadTeamRoles();
    }
  }, [isAdmin, isEditing]);

  const loadTeamRoles = async () => {
    setLoadingRoles(true);
    try {
      const response = await fetch('/api/admin/team-roles', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const roles = await response.json();
        setAvailableTeamRoles(roles);
      }
    } catch (error) {
      console.error('Error loading team roles:', error);
    } finally {
      setLoadingRoles(false);
    }
  };

  if (!isOpen) return null;

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

  const handleCancel = () => {
    setEditedUser({
      ...user,
      teams: normalizeTeams(user.teams)
    });
    setIsEditing(false);
  };

  const handleRoleToggle = (role: string) => {
    const currentRoles = editedUser.roles || [];
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];
    
    setEditedUser({ ...editedUser, roles: newRoles });
  };

  const handleTeamToggle = (teamRole: string) => {
    const currentTeams = getUserTeams();
    const newTeams = currentTeams.includes(teamRole)
      ? currentTeams.filter(t => t !== teamRole)
      : [...currentTeams, teamRole];
    
    setEditedUser({ ...editedUser, teams: newTeams });
  };

  const isCollaborator = editedUser.roles?.includes('collaborator');
  const userTeams = getUserTeams();

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {isAdmin && isEditing ? 'Edit User' : 'User Details'}
          </h2>
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <div className={styles.modalContent}>
          <div className={styles.userProfile}>
            <img
              src={editedUser.photo || '/default_user.png'}
              alt={editedUser.displayName}
              className={styles.profileImage}
            />
            <div className={styles.profileInfo}>
              <h3>{editedUser.displayName}</h3>
              <p className={styles.username}>@{editedUser.username}</p>
              <span className={`${styles.status} ${styles[editedUser.status.toLowerCase()]}`}>
                {editedUser.status}
              </span>
            </div>
          </div>

          <div className={styles.detailsGrid}>
            <div className={styles.detailGroup}>
              <label className={styles.label}>Email</label>
              <p className={styles.value}>{editedUser.email || 'Not provided'}</p>
            </div>

            <div className={styles.detailGroup}>
              <label className={styles.label}>Campus</label>
              <p className={styles.value}>{editedUser.campus || 'Unknown'}</p>
            </div>

            {editedUser.courses && editedUser.courses.length > 0 && (
              <div className={styles.detailGroup}>
                <label className={styles.label}>Courses</label>
                <div className={styles.coursesList}>
                  {editedUser.courses.map((course, index) => (
                    <span key={index} className={styles.courseTag}>
                      {course}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {isAdmin && (
              <div className={styles.detailGroup}>
                <label className={styles.label}>Roles</label>
                {isEditing ? (
                  <div className={styles.rolesEditor}>
                    {['member', 'collaborator', 'admin'].map(role => (
                      <label key={role} className={styles.roleCheckbox}>
                        <input
                          type="checkbox"
                          checked={(editedUser.roles || []).includes(role)}
                          onChange={() => handleRoleToggle(role)}
                        />
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className={styles.rolesList}>
                    {(editedUser.roles || []).length > 0 ? (
                      (editedUser.roles || []).map(role => (
                        <span key={role} className={styles.roleTag}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </span>
                      ))
                    ) : (
                      <span className={styles.noRoles}>No roles assigned</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {(userTeams.length > 0 || (isAdmin && isEditing && isCollaborator)) && (
              <div className={styles.detailGroup}>
                <label className={styles.label}>Team Roles</label>
                {isAdmin && isEditing && isCollaborator ? (
                  <div className={styles.teamsEditor}>
                    {loadingRoles ? (
                      <p>Loading team roles...</p>
                    ) : (
                      <div className={styles.teamRolesGrid}>
                        {availableTeamRoles.map(teamRole => (
                          <label key={teamRole.value} className={styles.teamRoleCheckbox}>
                            <input
                              type="checkbox"
                              checked={userTeams.includes(teamRole.value)}
                              onChange={() => handleTeamToggle(teamRole.value)}
                            />
                            <span className={teamRole.isCoordinator ? styles.coordinatorLabel : styles.memberLabel}>
                              {teamRole.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.teamsList}>
                    {userTeams.length > 0 ? (
                      userTeams.map((team, index) => (
                        <span 
                          key={index} 
                          className={`${styles.teamTag} ${team.includes('COOR-') ? styles.coordinatorTag : styles.memberTag}`}
                        >
                          {team.includes('COOR-') ? `Coordinator - ${team.replace('COOR-', '')}` : team}
                        </span>
                      ))
                    ) : (
                      <span className={styles.noTeams}>No teams assigned</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {editedUser.position && (
              <div className={styles.detailGroup}>
                <label className={styles.label}>Position</label>
                <p className={styles.value}>{editedUser.position}</p>
              </div>
            )}

            {editedUser.registerDate && (
              <div className={styles.detailGroup}>
                <label className={styles.label}>Member Since</label>
                <p className={styles.value}>
                  {new Date(editedUser.registerDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {isAdmin && onUpdate && (
          <div className={styles.modalFooter}>
            {isEditing ? (
              <div className={styles.editActions}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={styles.saveButton}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className={styles.editButton}
              >
                Edit User
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}