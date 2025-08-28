import React, { useEffect } from 'react';
import './ToastNotification.css';

const ToastNotification = ({ message, type = 'success', isVisible, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'check_circle';
    }
  };

  return (
    <div className={`toast-notification ${type} ${isVisible ? 'show' : ''}`}>
      <div className="toast-content">
        <div className="toast-icon">
          <span className="material-symbols-outlined">{getIcon()}</span>
        </div>
        <p className="toast-message">{message}</p>
        <button className="toast-close" onClick={onClose}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
    </div>
  );
};

export default ToastNotification;