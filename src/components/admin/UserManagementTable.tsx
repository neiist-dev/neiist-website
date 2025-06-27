import { useState } from 'react';
import { UserData } from '@/types/user';
import Image from 'next/image';
import styles from '@/styles/components/admin/UserManagementTable.module.css';

interface UserManagementTableProps {
  users: UserData[];
  onUserSelect: (user: UserData) => void;
  isAdmin: boolean;
  showRoles?: boolean;
}

export default function UserManagementTable({ 
  users, 
  onUserSelect, 
  isAdmin, 
  showRoles = false 
}: UserManagementTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'username'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredUsers = users
    .filter(user => {
      const searchMatch = [user.displayName, user.username, user.email]
        .some(field => field?.toLowerCase().includes(searchTerm.toLowerCase()));
      return searchMatch;
    })
    .sort((a, b) => {
      const getValue = (user: UserData) => {
        switch (sortBy) {
          case 'name': return user.displayName;
          case 'status': return user.status;
          case 'username': return user.username;
          default: return '';
        }
      };
      const comparison = getValue(a).localeCompare(getValue(b));
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: typeof sortBy) => {
    if (sortBy !== field) return '';
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className={styles.container}>
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by name, username, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Photo</th>
              <th className={styles.sortable} onClick={() => handleSort('name')}>
                Name{getSortIcon('name')}
              </th>
              <th className={styles.sortable} onClick={() => handleSort('username')}>
                Username{getSortIcon('username')}
              </th>
              <th>Email</th>
              <th className={styles.sortable} onClick={() => handleSort('status')}>
                Status{getSortIcon('status')}
              </th>
              {showRoles && <th>Roles</th>}
              <th>Campus</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.username} className={styles.userRow}>
                <td>
                  <Image
                    src={user.photo || '/default_user.png'}
                    alt={user.displayName}
                    width={40}
                    height={40}
                    className={styles.userPhoto}
                    unoptimized={user.photo?.startsWith('data:')}
                  />
                </td>
                <td className={styles.userName}>{user.displayName}</td>
                <td className={styles.username}>{user.username}</td>
                <td className={styles.email}>{user.email || 'N/A'}</td>
                <td>
                  <span className={`${styles.status} ${styles[user.status.toLowerCase()]}`}>
                    {user.status}
                  </span>
                </td>
                {showRoles && (
                  <td>
                    <div className={styles.roles}>
                      {user.roles?.map(role => (
                        <span key={role} className={styles.roleTag}>{role}</span>
                      )) || 'None'}
                    </div>
                  </td>
                )}
                <td>{user.campus || 'Unknown'}</td>
                <td>
                  <button
                    onClick={() => onUserSelect(user)}
                    className={styles.actionButton}
                  >
                    {isAdmin ? 'Edit' : 'View'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className={styles.noResults}>
            No users found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
