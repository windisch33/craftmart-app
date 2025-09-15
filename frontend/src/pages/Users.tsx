import React, { useState, useEffect } from 'react';
import authService from '../services/auth';
import type { User, RegisterRequest } from '../services/auth';
import UserForm from '../components/users/UserForm';
import './Users.css';
import '../styles/common.css';
import { UsersIcon, SearchIcon, AlertTriangleIcon, MailIcon, ClockIcon, CalendarIcon, EditIcon, KeyIcon } from '../components/common/icons';
import AccessibleModal from '../components/common/AccessibleModal';
import EmptyState from '../components/common/EmptyState';
import { formatDate } from '../utils/format';
import { useToast } from '../components/common/ToastProvider';

const Users: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Password reset modal state
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(null);
  const { showToast } = useToast();

  // Load all users on component mount
  useEffect(() => {
    loadAllUsers();
  }, []);

  const loadAllUsers = async () => {
    try {
      setError(null);
      setLoading(true);
      const allUsers = await authService.getAllUsers();
      setUsers(allUsers);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchTerm(query);
    
    if (!query.trim()) {
      // If search is cleared, show all users again
      setIsSearching(false);
      await loadAllUsers();
      return;
    }

    try {
      setError(null);
      setIsSearching(true);
      const searchResults = await authService.searchUsers(query);
      setUsers(searchResults);
    } catch (err: any) {
      setError(err.message || 'Search failed');
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingUser(null);
  };

  const handleSaveUser = async (userData: RegisterRequest) => {
    try {
      if (editingUser) {
        // Update existing user
        const updates: Partial<User> = {
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          role: userData.role,
        };
        const updatedUser = await authService.updateUser(editingUser.id, updates);
        setUsers(users.map(u => 
          u.id === editingUser.id ? updatedUser : u
        ));
      } else {
        // Create new user
        const newUser = await authService.createUser(userData);
        setUsers([newUser, ...users]);
      }
      
      setIsFormOpen(false);
      setEditingUser(null);
      showToast(editingUser ? 'User updated' : 'User created successfully', { type: 'success' });
    } catch (err: any) {
      showToast(err?.message || 'Failed to save user', { type: 'error' });
      throw err; // Let the form handle the error for field-level display
    }
  };


  const handleResetPassword = (user: User) => {
    setResetPasswordUserId(user.id);
    setIsResetPasswordOpen(true);
  };

  const handleResetPasswordSubmit = async (newPassword: string) => {
    if (!resetPasswordUserId) return;

    try {
      await authService.resetUserPassword(resetPasswordUserId, newPassword);
      setIsResetPasswordOpen(false);
      setResetPasswordUserId(null);
      showToast('Password reset successfully', { type: 'success' });
    } catch (err: any) {
      showToast(err?.message || 'Failed to reset password', { type: 'error' });
      throw err; // Let the modal handle the error
    }
  };


  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  // const currentUser = authService.getCurrentUser();

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="gradient-title">Users</h1>
          <p className="page-subtitle">Manage system users and permissions</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={handleAddUser}>
            <span className="nav-icon"><UsersIcon /></span>
            Add User
          </button>
        </div>
      </div>

      {/* Large Search Bar */}
      <div className="search-section">
        <div className="search-container-large">
          <div className="search-icon-large"><SearchIcon /></div>
          <input
            type="text"
            placeholder="Search users by name, email, or role..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input-large"
            autoFocus
          />
        </div>
        {isSearching && (
          <p className="search-status">Showing search results for "{searchTerm}"</p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="card" style={{marginBottom: '24px', backgroundColor: '#fef2f2', border: '1px solid #fecaca'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c'}}>
            <AlertTriangleIcon />
            {error}
          </div>
        </div>
      )}

      {users.length === 0 ? (
        <EmptyState
          icon={<SearchIcon />}
          title="No users found"
          description="Try adjusting your search terms or add a new user."
          action={{ label: 'Add User', onClick: handleAddUser }}
        />
      ) : (
        <div className="customers-grid">
          {users.map(user => (
            <div key={user.id} className="customer-card">
              <div className="customer-header">
                <div className="customer-info">
                  <h3 className="customer-name">{user.first_name} {user.last_name}</h3>
                </div>
              </div>

              <div className="customer-contact">
                {user.email && (
                  <div className="contact-item">
                    <span className="contact-icon"><MailIcon /></span>
                    <span>{user.email}</span>
                  </div>
                )}
                <div className="contact-item">
                  <span className="contact-icon"><UsersIcon /></span>
                  <span>Role: {user.role === 'admin' ? 'Administrator' : 'Employee'}</span>
                </div>
                {user.last_login && (
                  <div className="contact-item">
                    <span className="contact-icon"><ClockIcon /></span>
                    <span>Last login: {formatDate(user.last_login)}</span>
                  </div>
                )}
                <div className="contact-item">
                  <span className="contact-icon"><CalendarIcon /></span>
                  <span>Created: {formatDate(user.created_at)}</span>
                </div>
              </div>

              <div className="customer-actions">
                <button 
                  className="action-btn" 
                  onClick={() => handleEditUser(user)}
                >
                  <span className="contact-icon"><EditIcon /></span> Edit
                </button>
                <button 
                  className="action-btn" 
                  onClick={() => handleResetPassword(user)}
                >
                  <span className="contact-icon"><KeyIcon /></span> Reset Password
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Form Modal */}
      {isFormOpen && (
        <UserForm
          user={editingUser}
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSave={handleSaveUser}
        />
      )}

      {/* Password Reset Modal */}
      {isResetPasswordOpen && (
        <AccessibleModal isOpen={true} onClose={() => setIsResetPasswordOpen(false)} labelledBy="reset-password-title" overlayClassName="modal-overlay" contentClassName="modal-content">
          <div className="modal-header">
            <h2 id="reset-password-title">Reset Password</h2>
            <button className="modal-close" onClick={() => setIsResetPasswordOpen(false)} aria-label="Close dialog">×</button>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const newPassword = formData.get('newPassword') as string;
            handleResetPasswordSubmit(newPassword);
          }}>
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                required
                minLength={8}
                placeholder="Enter new password (min 8 characters)"
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsResetPasswordOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Reset Password
              </button>
            </div>
          </form>
        </AccessibleModal>
      )}
    </div>
  );
};

export default Users;
