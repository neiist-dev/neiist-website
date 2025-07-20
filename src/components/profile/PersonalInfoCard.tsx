import { useEffect } from 'react';
import styles from '@/styles/components/profile/PersonalInfoCard.module.css';
import { User } from '@/types/user';

type Props = {
  user: User;
  editing: boolean;
  formData?: {
    alternativeEmail: string;
    phone: string;
    preferredContactMethod: string;
  };
  onFormChange?: (field: string, value: string) => void;
};

export default function PersonalInfoCard({ 
  user, 
  editing, 
  formData, 
  onFormChange
}: Props) {
  useEffect(() => {
    if (editing && formData && onFormChange) {
      const hasAlternativeEmail = formData.alternativeEmail || user.alternativeEmail;
      const hasPhone = formData.phone || user.phone;
      if (formData.preferredContactMethod === 'alternativeEmail' && !hasAlternativeEmail) {
        onFormChange('preferredContactMethod', 'email');
      }
      else if (formData.preferredContactMethod === 'phone' && !hasPhone) {
        onFormChange('preferredContactMethod', 'email');
      }
    }
  }, [editing, formData, formData?.alternativeEmail, formData?.phone, formData?.preferredContactMethod, user.alternativeEmail, user.phone, onFormChange]);

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>Dados Pessoais</h3>
      <div className={styles.grid}>
        
        <div className={styles.field}>
          <div className={styles.label}>Nome</div>
          <div className={styles.value}>{user.name}</div>
        </div>

        <div className={styles.field}>
          <div className={styles.label}>IST ID</div>
          <div className={styles.value}>{user.istid}</div>
        </div>

        <div className={styles.field}>
          <div className={styles.label}>Email Principal</div>
          <div className={styles.value}>{user.email || 'Não especificado'}</div>
        </div>

        <div className={styles.field}>
          <div className={styles.label}>Email Alternativo</div>
          {editing ? (
            <input
              type="email"
              value={formData?.alternativeEmail || ''}
              onChange={(e) => onFormChange?.('alternativeEmail', e.target.value)}
              className={styles.input}
              placeholder="email@exemplo.com"
            />
          ) : (
            <div className={styles.value}>{user.alternativeEmail || 'Não especificado'}</div>
          )}
        </div>

        <div className={styles.field}>
          <div className={styles.label}>Telefone</div>
          {editing ? (
            <input
              type="tel"
              value={formData?.phone || ''}
              onChange={(e) => onFormChange?.('phone', e.target.value)}
              className={styles.input}
              placeholder="+351 xxx xxx xxx"
            />
          ) : (
            <div className={styles.value}>{user.phone || 'Não especificado'}</div>
          )}
        </div>

        <div className={styles.field}>
          <div className={styles.label}>Contacto Preferido</div>
          {editing ? (
            <select
              value={formData?.preferredContactMethod || 'email'}
              onChange={(e) => onFormChange?.('preferredContactMethod', e.target.value)}
              className={styles.input}
            >
              <option value="email">Email Principal</option>
              {(formData?.alternativeEmail || user.alternativeEmail) && (
                <option value="alternativeEmail">Email Alternativo</option>
              )}
              {(formData?.phone || user.phone) && (
                <option value="phone">Telefone</option>
              )}
            </select>
          ) : (
            <div className={styles.value}>
              {user.preferredContactMethod === 'email' ? 'Email Principal' :
               user.preferredContactMethod === 'alternativeEmail' ? 'Email Alternativo' :
               user.preferredContactMethod === 'phone' ? 'Telefone' :
               'Email Principal (padrão)'}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
