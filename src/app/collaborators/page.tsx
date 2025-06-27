'use client';

import { useState, useEffect } from 'react';
import { UserData } from '@/types/user';
import UserManagementTable from '@/components/admin/UserManagementTable';
import CollaboratorDetailsModal from '@/components/admin/CollaboratorDetailsModal';
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

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users/collab-members', {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch users');

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

  const handleUserUpdate = async (updatedUser: UserData) => {
    try {
      const response = await fetch('/api/admin/users/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to update user');

      await loadUsers();
      setIsModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  if (!isAuthorized || !currentUser) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingText}>
          {!isAuthorized ? 'Loading...' : 'Access denied'}
        </div>
      </div>
    );
  }

  const isAdmin = !!currentUser.isAdmin;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Collaborators & Members</h1>
        <div className={styles.userCount}>
          {users.length} {users.length === 1 ? 'user' : 'users'}
        </div>
      </div>

      <div className={styles.content}>
        {usersLoading ? (
          <div className={styles.loadingText}>Loading users...</div>
        ) : (
          <UserManagementTable
            users={users}
            onUserSelect={handleUserSelect}
            isAdmin={isAdmin}
            showRoles={true}
          />
        )}
      </div>

      {isModalOpen && selectedUser && (
        <CollaboratorDetailsModal
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
  );
}
