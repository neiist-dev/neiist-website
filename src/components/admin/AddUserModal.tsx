import { useState, useEffect } from 'react';
import { TeamRole } from '@/types/user';
import styles from '@/styles/components/admin/AddUserModal.module.css';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

export default function AddUserModal({ isOpen, onClose, onUserAdded }: AddUserModalProps) {
  const [istid, setIstid] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [position, setPosition] = useState('');
  const [registerDate, setRegisterDate] = useState('');
  const [electorDate, setElectorDate] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [startRenewalDate, setStartRenewalDate] = useState('');
  const [endRenewalDate, setEndRenewalDate] = useState('');
  const [renewalNotification, setRenewalNotification] = useState(false);
  const [availableTeamRoles, setAvailableTeamRoles] = useState<TeamRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load team roles when modal opens
  useEffect(() => {
    if (isOpen && availableTeamRoles.length === 0) {
      loadTeamRoles();
    }
  }, [isOpen, availableTeamRoles.length]);

  const loadTeamRoles = async () => {
    setLoadingRoles(true);
    try {
      const response = await fetch('/api/admin/team-roles', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const teamRoles = await response.json();
        setAvailableTeamRoles(teamRoles);
      }
    } catch (error) {
      console.error('Error loading team roles:', error);
    } finally {
      setLoadingRoles(false);
    }
  };

  const resetForm = () => {
    setIstid('');
    setRoles([]);
    setTeams([]);
    setPosition('');
    setRegisterDate('');
    setElectorDate('');
    setFromDate('');
    setToDate('');
    setStartRenewalDate('');
    setEndRenewalDate('');
    setRenewalNotification(false);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleRoleToggle = (role: string) => {
    const newRoles = roles.includes(role)
      ? roles.filter(r => r !== role)
      : [...roles, role];
    setRoles(newRoles);

    // Clear teams if not collaborator
    if (!newRoles.includes('collaborator')) {
      setTeams([]);
    }
  };

  const handleTeamToggle = (teamRole: string) => {
    const newTeams = teams.includes(teamRole)
      ? teams.filter(t => t !== teamRole)
      : [...teams, teamRole];
    setTeams(newTeams);
  };

  const validateForm = () => {
    if (!istid.trim()) {
      setError('IST ID is required');
      return false;
    }
    if (!/^ist1\d{6}$/.test(istid)) {
      setError('IST ID must follow the format "ist1" followed by 6 digits (e.g., ist1xxxxxx)');
      return false;
    }

    if (roles.length === 0) {
      setError('At least one role must be selected');
      return false;
    }

    if (roles.includes('collaborator') && (!fromDate || !toDate)) {
      setError('Collaborator role requires from and to dates');
      return false;
    }

    if (roles.includes('member') && !registerDate) {
      setError('Member role requires a register date');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const userData = {
        username: istid.toLowerCase(),
        roles,
        teams: roles.includes('collaborator') ? teams : [],
        position: roles.includes('collaborator') ? position || 'Collaborator' : undefined,
        registerDate: roles.includes('member') ? registerDate : undefined,
        electorDate: roles.includes('member') ? electorDate : undefined,
        fromDate: roles.includes('collaborator') ? fromDate : undefined,
        toDate: roles.includes('collaborator') ? toDate : undefined,
        startRenewalDate: roles.includes('member') ? startRenewalDate : undefined,
        endRenewalDate: roles.includes('member') ? endRenewalDate : undefined,
        renewalNotification: roles.includes('member') ? renewalNotification : undefined
      };

      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      onUserAdded();
      handleClose();
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Add New User</h2>
          <button onClick={handleClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalContent}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>IST ID *</label>
              <input
                type="text"
                value={istid}
                onChange={(e) => setIstid(e.target.value)}
                placeholder="ist1xxxxxx"
                className={styles.input}
                required
              />
              <p className={styles.helpText}>Format: ist1 followed by 6 digits</p>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>NEIIST Roles *</label>
              <div className={styles.rolesEditor}>
                {['member', 'collaborator', 'admin'].map(role => (
                  <label key={role} className={styles.roleCheckbox}>
                    <input
                      type="checkbox"
                      checked={roles.includes(role)}
                      onChange={() => handleRoleToggle(role)}
                    />
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            {roles.includes('collaborator') && (
              <>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Position</label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Collaborator"
                    className={styles.input}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Team Roles</label>
                  {loadingRoles ? (
                    <p>Loading team roles...</p>
                  ) : (
                    <div className={styles.teamRolesGrid}>
                      {availableTeamRoles.map(teamRole => (
                        <label 
                          key={teamRole.value} 
                          className={`${styles.teamRoleCheckbox} ${teamRole.isCoordinator ? styles.coordinatorLabel : styles.memberLabel}`}
                        >
                          <input
                            type="checkbox"
                            checked={teams.includes(teamRole.value)}
                            onChange={() => handleTeamToggle(teamRole.value)}
                          />
                          {teamRole.label}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.dateRangeContainer}>
                  <div className={styles.dateField}>
                    <label className={styles.label}>From Date *</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className={styles.dateInput}
                      required={roles.includes('collaborator')}
                    />
                  </div>
                  <div className={styles.dateField}>
                    <label className={styles.label}>To Date *</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className={styles.dateInput}
                      required={roles.includes('collaborator')}
                    />
                  </div>
                </div>
              </>
            )}

            {roles.includes('member') && (
              <>
                <div className={styles.dateRangeContainer}>
                  <div className={styles.dateField}>
                    <label className={styles.label}>Register Date *</label>
                    <input
                      type="date"
                      value={registerDate}
                      onChange={(e) => setRegisterDate(e.target.value)}
                      className={styles.dateInput}
                      required={roles.includes('member')}
                    />
                  </div>
                  <div className={styles.dateField}>
                    <label className={styles.label}>Elector Date</label>
                    <input
                      type="date"
                      value={electorDate}
                      onChange={(e) => setElectorDate(e.target.value)}
                      className={styles.dateInput}
                    />
                  </div>
                </div>

                <div className={styles.dateRangeContainer}>
                  <div className={styles.dateField}>
                    <label className={styles.label}>Start Renewal Date</label>
                    <input
                      type="date"
                      value={startRenewalDate}
                      onChange={(e) => setStartRenewalDate(e.target.value)}
                      className={styles.dateInput}
                    />
                  </div>
                  <div className={styles.dateField}>
                    <label className={styles.label}>End Renewal Date</label>
                    <input
                      type="date"
                      value={endRenewalDate}
                      onChange={(e) => setEndRenewalDate(e.target.value)}
                      className={styles.dateInput}
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.checkboxContainer}>
                    <input
                      type="checkbox"
                      checked={renewalNotification}
                      onChange={(e) => setRenewalNotification(e.target.checked)}
                    />
                    Send renewal notification
                  </label>
                </div>
              </>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button
              type="submit"
              disabled={saving}
              className={styles.saveButton}
            >
              {saving ? 'Creating...' : 'Create User'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
