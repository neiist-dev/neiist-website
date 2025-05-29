import styles from '@/styles/components/profile/RolesCard.module.css';

interface RolesCardProps {
  user: {
    roles?: string[];
    teams?: string[];
    position?: string;
    registerDate?: string;
    electorDate?: string;
    fromDate?: string;
    toDate?: string;
  };
}

export default function RolesCard({ user }: RolesCardProps) {
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

  // Don't render if user has no NEIIST roles
  if (!user.roles || user.roles.length === 0) {
    return null;
  }

  return (
    <div className={styles.neiistSection}>
      <h3 className={styles.sectionTitle}>NEIIST Roles</h3>
      <div className={styles.rolesGrid}>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Current Roles</label>
          <div className={styles.rolesContainer}>
            {user.roles.map((role, index) => (
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
                <span 
                  key={index} 
                  className={`${styles.teamTag} ${team.includes('COOR-') ? styles.coordinatorTag : styles.memberTag}`}
                >
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
  );
}