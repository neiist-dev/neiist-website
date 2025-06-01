import styles from '@/styles/components/profile/PersonalInfoCard.module.css';

type User = {
  email?: string;
  campus?: string;
  courses?: string[];
};

type Props = {
  user: User;
  editing: boolean;
  form?: { name: string };
  onNameChange?: (val: string) => void;
};

export default function PersonalInfoCard({ user }: Props) {
  return (
    <>
      <div className={styles.title}>Personal Information</div>
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.label}>Email</div>
          <div className={styles.value}>{user.email || 'Not specified'}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.label}>Campus</div>
          <div className={styles.value}>{user.campus || 'Not specified'}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.label}>Courses</div>
          <div className={styles.tags}>
            {user.courses?.length
              ? user.courses.map((c, i) => (
                  <span className={styles.tag} key={i}>{c}</span>
                ))
              : <span className={styles.empty}>No courses registered</span>
            }
          </div>
        </div>
      </div>
    </>
  );
}
