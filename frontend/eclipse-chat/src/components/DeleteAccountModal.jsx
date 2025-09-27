import React, { useState, useRef, useEffect } from 'react';
import './DeleteAccountModal.css';
import bannerImage from '../assets/delete-section-banner.png'


const DeleteAccountModal = ({ isOpen, onClose, onDeleteAccount }) => {
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
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
  useEffect(()=>{
    setTimeout(() => {
       setError('');
    }, 5000);
   
  },[error])
  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setError('');
      setIsDeleting(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      const result = await onDeleteAccount(password);
      
      if (!result.success) {
        setError(result.message);
        setIsDeleting(false);
      }
      // If successful, the parent component will handle navigation
    } catch (error) {
      setError('An unexpected error occurred');
      console.error(error);
      setIsDeleting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isDeleting) {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
      <div className="delete-account-modal" ref={modalRef}>
        <div className="delete-modal-header">
          <div className="delete-icon">
            <span className="material-symbols-outlined">delete_forever</span>
          </div>
          <h2>Initiating self-destruct sequence.</h2>
        </div>
        <div className="banner-holder">
          <img src={bannerImage} alt="good bye message image" />
        </div>
        <div className="delete-modal-content">
          
          <div className="sorry-message">
              <p>Your journey with us has been a great one. We're sad to see your star fade. <i className="ph ph-heart"></i></p>
              <p>This action will erase your cosmic footprint, all constellations (connections), and interstellar logs (conversations) forever. There is no recovery from the void.</p>
          </div>

          <div className="delete-form">
            <div className="input-group">
              <label htmlFor="password">Enter your password to confirm:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Your current password"
                disabled={isDeleting}
                required
              />
            </div>

            {error && (
              <div className="error-message">
                <span className="material-symbols-outlined">error</span>
                <span>{error}</span>
              </div>
            )}

            <div className="modal-actions">
              <button 
                type="button" 
                className="cancel-button" 
                onClick={onClose}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="delete-button"
                onClick={handleSubmit}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="loading-spinner"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">delete_forever</span>
                    Delete Account
                  </>
                )}
              </button>
            </div>
          </div>

        </div> 
        

      
      </div>
  );
};

export default DeleteAccountModal;



