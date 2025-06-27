'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserData } from '@/types/user';
import UserManagementTable from '@/components/admin/UserManagementTable';
import AdminUserModal from '@/components/admin/AdminDetailsModal';
import CollaboratorDetailsModal from '@/components/admin/CollaboratorDetailsModal';
import AddUserModal from '@/components/admin/AddUserModal';
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const isAdmin = !!currentUser?.isAdmin;

  const loadUsers = useCallback(async () => {
    try {
      const endpoint = isAdmin ? '/api/admin/users/all' : '/api/users/collab-members';
      const response = await fetch(endpoint, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch users');
      setUsers(await response.json());
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAuthorized && currentUser) loadUsers();
  }, [isAuthorized, currentUser, loadUsers]);

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
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {isAdmin ? 'Manage All Users' : 'Collaborators & Members'}
        </h1>
        <div className={styles.headerInfo}>
          {isAdmin && (
            <button 
              onClick={() => setIsAddModalOpen(true)} 
              className={`${styles.headerButton} ${styles.addButton}`}
            >
              Add User
            </button>
          )}
          <span className={`${styles.headerButton} ${styles.userCount}`}>
            {users.length} {users.length === 1 ? 'user' : 'users'}
          </span>
        </div>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>Loading users...</div>
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
        isAdmin ? (
          <AdminUserModal
            user={selectedUser}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedUser(null);
            }}
            onUpdate={handleUserUpdate}
          />
        ) : (
          <CollaboratorDetailsModal
            user={selectedUser}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedUser(null);
            }}
            onUpdate={undefined}
            isAdmin={false}
          />
        )
      )}

      {isAdmin && (
        <AddUserModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onUserAdded={loadUsers}
        />
      )}
    </div>
  );
}
