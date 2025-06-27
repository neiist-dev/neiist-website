'use client';

import { useState, useEffect } from 'react';
import { UserData } from '@/types/user';
import UserManagementTable from '@/components/admin/UserManagementTable';
import AdminUserModal from '@/components/admin/AdminDetailsModal';
import AddUserModal from '@/components/admin/AddUserModal';
import { useAuthRedirect } from '@/utils/AuthRedirect';
import styles from '@/styles/pages/AdminPage.module.css';

export default function AdminPage() {
  const { user: currentUser, isAuthorized } = useAuthRedirect({
    requireAuth: true,
    requiredStatus: ['Admin']
  });
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users/all', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const usersData = await response.json();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized && currentUser) {
      loadUsers();
    }
  }, [isAuthorized, currentUser]);

  const handleUserSelect = (user: UserData) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleUserUpdate = (updatedUser: UserData) => {
    (async () => {
      try {
        const response = await fetch('/api/admin/users/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedUser),
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to update user');
        }

        await loadUsers();
        setIsModalOpen(false);
        setSelectedUser(null);
      } catch (error) {
        console.error('Error updating user:', error);
      }
    })();
  };

  const handleUserAdded = () => {
    loadUsers();
  };

  if (!isAuthorized) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingText}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!currentUser || !currentUser.isAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <div className={styles.errorText}>Admin access required</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>Manage All Users</h1>
          <div className={styles.headerInfo}>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className={styles.addButton}
            >
              Add User
            </button>
            <span className={styles.userCount}>
              {users.length} {users.length === 1 ? 'user' : 'users'}
            </span>
          </div>
        </div>

        {usersLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingText}>Loading users...</div>
          </div>
        ) : (
          <UserManagementTable
            users={users}
            onUserSelect={handleUserSelect}
            isAdmin={true}
            showRoles={true}
          />
        )}
      </div>

      {isModalOpen && selectedUser && (
        <AdminUserModal
          user={selectedUser}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          onUpdate={handleUserUpdate}
        />
      )}

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUserAdded={handleUserAdded}
      />
    </div>
  );
}
