'use client';

import { useState, useEffect } from 'react';
import { UserData } from '@/types/user';
import UserManagementTable from '@/components/admin/UserManagementTable';
import UserDetailsModal from '@/components/admin/UserDetailModal';
import { useAuthRedirect } from '@/utils/AuthRedirect';
import styles from '@/styles/pages/CollabPage.module.css';

export default function CollaboratorsPage() {
  const { user: currentUser, isAuthorized } = useAuthRedirect({
    requireAuth: true,
    requiredStatus: ['Member', 'Collaborator', 'Admin']
  });
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);

  const loadUsers = async (isAdmin: boolean) => {
    try {
      const endpoint = isAdmin ? '/api/admin/users/collab-members' : '/api/users/collab-members';
      const response = await fetch(endpoint, {
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
      loadUsers(currentUser.isAdmin || false);
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

        // Refresh user list
        await loadUsers(currentUser?.isAdmin || false);

        setIsModalOpen(false);
        setSelectedUser(null);
      } catch (error) {
        console.error('Error updating user:', error);
      }
    })();
  };

  if (!isAuthorized) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingText}>Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorText}>Access denied</div>
      </div>
    );
  }

  const isAdmin = !!currentUser.isAdmin;
  const pageTitle = isAdmin ? 'Manage Collaborators & Members' : 'Collaborators & Members';

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>{pageTitle}</h1>
            <div className={styles.headerInfo}>
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
              isAdmin={isAdmin}
              showRoles={true}
            />
          )}

          {isModalOpen && selectedUser && (
            <UserDetailsModal
              user={selectedUser}
              isOpen={isModalOpen}
              onClose={() => {
                setIsModalOpen(false);
                setSelectedUser(null);
              }}
              onUpdate={isAdmin ? handleUserUpdate : undefined}
              isAdmin={isAdmin}
            />
          )}
        </div>
      </div>
    </div>
  );
}