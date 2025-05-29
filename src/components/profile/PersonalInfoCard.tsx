import styles from '@/styles/components/profile/PersonalInfoCard.module.css';

interface PersonalInfoCardProps {
  user: {
    displayName?: string;
    email?: string;
    campus?: string;
    courses?: string[];
  };
  editing: boolean;
  formData: { displayName: string };
  onDisplayNameChange: (value: string) => void;
}

export default function PersonalInfoCard({ user, editing, formData, onDisplayNameChange }: PersonalInfoCardProps) {
  return (
    <div className={styles.fieldsGrid}>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Name</label>
        {editing ? (
          <input 
            type="text" 
            value={formData.displayName} 
            onChange={(e) => onDisplayNameChange(e.target.value)} 
            className={styles.input} 
          />
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
          {user.courses?.length ? 
            user.courses.map((course, index) => (
              <p key={index} className={styles.courseItem}>{course}</p>
            )) : 
            <p className={styles.noCourses}>No courses registered</p>
          }
        </div>
      </div>
    </div>
  );
}