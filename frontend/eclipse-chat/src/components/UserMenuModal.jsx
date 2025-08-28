import React, { useRef, useEffect } from 'react';
import './UserMenuModal.css';

const UserMenuModal = ({ isOpen, onClose, user, onLogout }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const menuItems = [
    {
      id: 'profile',
      title: 'Edit Profile',
      description: 'Update your information',
      icon: 'person_4', 
      action: () => {
        onClose();
        if (window.openEditProfile) {
          window.openEditProfile();
        }
      },
      type: 'normal'
    },
    {
      id: 'switch',
      title: 'Switch User',
      description: 'Change active account',
      icon: 'swap_horiz', 
      action: () => console.log('Switch User clicked'),
      type: 'normal'
    },
    {
      id: 'logout',
      title: 'Log Out',
      description: 'Sign out of your account',
      icon: 'logout',
      action: () => {
        onLogout();
        onClose();
      },
      type: 'normal'
    },
    {
      id: 'delete',
      title: 'Delete Account',
      description: 'Permanently remove account',
      icon: 'delete_forever',
      action: () => console.log('Delete Account clicked'),
      type: 'danger'
    }
  ];

  return (
    <div className="user-menu-overlay">
      <div className="user-menu-modal" ref={modalRef}>
        {/* Header */}
        <div className="user-menu-header">
          <div className="user-info">
            <div className="user-avatar-large">
              <img src={user?.avatar} alt="User Avatar" />
              <div className="status-indicator"></div>
            </div>
            <div className="user-details">
              <h3 className="user-display-name">{user?.displayName || "User"}</h3>
              <p className="modal-user-name">{user?.username || "Celestials"} | {user?.eclipseId || "Celestial ID"}</p>
              <p className="modal-user-name"></p>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            <span className='material-symbols-outlined'>close</span> 
          </button>
        </div>

        {/* Menu Items */}
        <div className="user-menu-content">
          {menuItems.map((item, index) => (
            <button
              key={item.id}
              className={`menu-item ${item.type}`}
              onClick={item.action}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="menu-item-icon">
                <span className='material-symbols-outlined'>{item.icon}</span>
              </div>
              <div className="menu-item-text">
                <span className="menu-item-title">{item.title}</span>
                <span className="menu-item-description">{item.description}</span>
              </div>
              <div className="menu-item-arrow">
                <span className='material-symbols-outlined'>chevron_right</span> 
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="user-menu-footer">
          <div className="encryption-status">
            <div className="status-icon material-symbols-outlined">lock</div>
            <span>End-to-end encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserMenuModal;