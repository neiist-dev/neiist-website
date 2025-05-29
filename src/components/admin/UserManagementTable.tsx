import { useState } from 'react';
import styles from '@/styles/components/admin/UserManagementTable.module.css';

interface User {
  username: string;
  displayName: string;
  email?: string;
  status: string;
  campus?: string;
  photo: string;
  roles?: string[];
  teams?: string[];
  position?: string;
}

interface UserManagementTableProps {
  users: User[];
  onUserSelect: (user: User) => void;
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'username'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredUsers = users
    .filter(user => {
      const matchesSearch = user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue = '';
      let bValue = '';
      
      switch (sortBy) {
        case 'name':
          aValue = a.displayName;
          bValue = b.displayName;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'username':
          aValue = a.username;
          bValue = b.username;
          break;
      }
      
      const comparison = aValue.localeCompare(bValue);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const uniqueStatuses = Array.from(new Set(users.map(user => user.status)));

  const handleSort = (field: 'name' | 'status' | 'username') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className={styles.tableContainer}>
      <div className={styles.filters}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search by name, username, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterContainer}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Statuses</option>
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Photo</th>
              <th 
                className={styles.sortable}
                onClick={() => handleSort('name')}
              >
                Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className={styles.sortable}
                onClick={() => handleSort('username')}
              >
                Username {sortBy === 'username' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Email</th>
              <th 
                className={styles.sortable}
                onClick={() => handleSort('status')}
              >
                Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
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
                  <img
                    src={user.photo || '/default_user.png'}
                    alt={user.displayName}
                    className={styles.userPhoto}
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
                    <div className={styles.rolesContainer}>
                      {user.roles?.map(role => (
                        <span key={role} className={styles.roleTag}>{role}</span>
                      )) || 'None'}
                    </div>
                  </td>
                )}
                <td className={styles.campus}>{user.campus || 'Unknown'}</td>
                <td>
                  <button
                    onClick={() => onUserSelect(user)}
                    className={styles.viewButton}
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