import styles from '@/styles/components/profile/RolesCard.module.css';

interface RolesCardProps {
  user: {
    roles?: string[];
    teams?: string[];
    position?: string;
    registerDate?: string;
    fromDate?: string;
    toDate?: string;
  };
}

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

export default function RolesCard({ user }: RolesCardProps) {
  if (!user.roles?.length) return null;

  return (
    <div>
      <div className={styles.title}>NEIIST Roles</div>
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.label}>Current Roles</div>
          {user.roles.map((role, i) => (
            <span key={i} className={styles.tag}>{role}</span>
          ))}
        </div>
        {user.teams?.length ? (
          <div className={styles.card}>
            <div className={styles.label}>Team Roles</div>
            {user.teams.map((team, i) => (
              <span key={i} className={styles.tag}>{team}</span>
            ))}
          </div>
        ) : null}
        {user.position && (
          <div className={styles.card}>
            <div className={styles.label}>Position</div>
            <div>{user.position}</div>
          </div>
        )}
        {user.registerDate && (
          <div className={styles.card}>
            <div className={styles.label}>Member Since</div>
            <div>{formatDate(user.registerDate)}</div>
          </div>
        )}
        {user.fromDate && user.toDate && (
          <div className={styles.card}>
            <div className={styles.label}>Collaborator Period</div>
            <div>
              {formatDate(user.fromDate)} – {formatDate(user.toDate)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
