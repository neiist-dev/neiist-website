import { useState, useEffect } from 'react';
import Image from 'next/image';
import { UserData, TeamRole } from '@/types/user';
import styles from '@/styles/components/admin/CollaboratorDetailsModal.module.css';

interface CollaboratorDetailsModalProps {
  user: UserData;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (user: UserData) => void;
  isAdmin: boolean;
}

export default function CollaboratorDetailsModal({ user, isOpen, onClose, onUpdate, isAdmin }: CollaboratorDetailsModalProps) {
  const [editedUser, setEditedUser] = useState<UserData>(user);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availableTeamRoles, setAvailableTeamRoles] = useState<TeamRole[]>([]);

  const normalizeTeams = (teams: string[] | string | undefined): string[] => {
    if (!teams) return [];
    if (Array.isArray(teams)) return teams;
    if (typeof teams === 'string') {
      if (teams.startsWith('{') && teams.endsWith('}')) {
        return teams.slice(1, -1).split(',').filter(t => t.trim().length > 0);
      }
      return [teams];
    }
    return [];
  };

  useEffect(() => {
    setEditedUser({ ...user, teams: normalizeTeams(user.teams) });
    setIsEditing(false);
  }, [user]);

  useEffect(() => {
    if (isAdmin && isEditing) loadTeamRoles();
  }, [isAdmin, isEditing]);

  const loadTeamRoles = async () => {
    try {
      const response = await fetch('/api/admin/team-roles', { credentials: 'include' });
      if (response.ok) {
        const roles = await response.json();
        setAvailableTeamRoles(roles);
      }
    } catch (error) {
      console.error('Error loading team roles:', error);
    }
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

  const handleTeamToggle = (teamRole: string) => {
    const currentTeams = normalizeTeams(editedUser.teams);
    const newTeams = currentTeams.includes(teamRole)
      ? currentTeams.filter(t => t !== teamRole)
      : [...currentTeams, teamRole];
    setEditedUser({ ...editedUser, teams: newTeams });
  };

  const formatTeamName = (team: string) =>
    team.includes('COOR-') ? `Coordinator - ${team.replace('COOR-', '')}` : team;

  if (!isOpen) return null;

  const userTeams = normalizeTeams(editedUser.teams);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className={styles.close}>×</button>
        
        <h2>{isAdmin && isEditing ? 'Edit Team Roles' : 'Collaborator Details'}</h2>
        
        <div className={styles.profile}>
          <Image
            src={editedUser.photo || '/default_user.png'}
            alt={editedUser.displayName}
            width={64}
            height={64}
            className={styles.avatar}
          />
          <div>
            <h3>{editedUser.displayName}</h3>
            <p>@{editedUser.username}</p>
            <span className={styles.status}>{editedUser.status}</span>
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
              {editedUser.courses.map((course, i) => (
                <span key={i} className={styles.tag}>{course}</span>
              ))}
            </div>
          </>
        )}
        
        <label>Team Roles</label>
        {isAdmin && isEditing ? (
          <div>
            {availableTeamRoles.map(teamRole => (
              <label key={teamRole.value} className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={userTeams.includes(teamRole.value)}
                  onChange={() => handleTeamToggle(teamRole.value)}
                />
                {teamRole.label}
              </label>
            ))}
          </div>
        ) : (
          <div>
            {userTeams.length > 0
              ? userTeams.map((team, i) => (
                  <span key={i} className={styles.tag}>
                    {formatTeamName(team)}
                  </span>
                ))
              : <p>No team roles assigned</p>}
          </div>
        )}

        {isAdmin && onUpdate && (
          <div className={styles.actions}>
            {isEditing ? (
              <>
                <button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => {
                  setEditedUser({ ...user, teams: normalizeTeams(user.teams) });
                  setIsEditing(false);
                }}>
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)}>Edit Teams</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
