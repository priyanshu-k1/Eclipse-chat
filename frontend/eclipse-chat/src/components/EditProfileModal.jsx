import React, { useState, useRef, useEffect } from 'react';
import './EditProfileModal.css';
import NotificationModal from './NotificationModal';

const EditProfileModal = ({ isOpen, onClose, user, onUpdateProfile }) => {
  const modalRef = useRef(null);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [activeTab, setActiveTab] = useState('general');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize avatar settings with proper defaults
  const [avatarSettings, setAvatarSettings] = useState({
    character: '', 
    font: 'Montserrat',
    backgroundColor: '#3B82F6',
    foregroundColor: '#FFFFFF',
  });

  // Update avatar character when display name changes
  useEffect(() => {
    if (formData.displayName && formData.displayName.length > 0) {
      setAvatarSettings(prev => ({
        ...prev,
        character: formData.displayName[0].toUpperCase()
      }));
    } else {
      setAvatarSettings(prev => ({
        ...prev,
        character: ''
      }));
    }
  }, [formData.displayName]);


  useEffect(() => {
    if (isOpen && !isInitialized) {
      setFormData({
        displayName: user?.displayName || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    
      setAvatarSettings({
        character: user?.displayName?.[0]?.toUpperCase() || '', 
        font: 'Montserrat',
        backgroundColor: '#3B82F6',
        foregroundColor: '#FFFFFF',
      });
      setErrors({});
      setSuccessMessage('');
      setActiveTab('general');
      setIsInitialized(true);
    } else if (!isOpen) {
      setIsInitialized(false);
    }
  }, [isOpen, user, isInitialized]);

  // Handle click outside and escape key
  useEffect(() => {
  
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleAvatarSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAvatarSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Fixed character input handler
  const handleCharacterChange = (e) => {
    const value = e.target.value.slice(0, 2);
    setAvatarSettings(prev => ({
      ...prev,
      character: value.toUpperCase()
    }));
  };

  // Fixed hex color input handlers
  const handleHexColorChange = (colorType, value) => {
    // Ensure hex format
    if (value.startsWith('#') && (value.length === 4 || value.length === 7)) {
      setAvatarSettings(prev => ({
        ...prev,
        [colorType]: value
      }));
    } else if (!value.startsWith('#') && value.length === 6) {
      setAvatarSettings(prev => ({
        ...prev,
        [colorType]: `#${value}`
      }));
    }
  };

  const generateAvatarPreview = () => {
    const { character, font, backgroundColor, foregroundColor} = avatarSettings;
    const cleanBg = backgroundColor.replace('#', '');
    const cleanFg = foregroundColor.replace('#', '');
    const displayChar = character || '?';
      return `https://placehold.co/120x120/${cleanBg}/${cleanFg}?text=${encodeURIComponent(displayChar)}&font=${encodeURIComponent(font)}&radius=50`;
  };

  const validateForm = () => {
    const newErrors = {};

    if (activeTab === 'general') {
      if (!formData.displayName.trim()) {
        newErrors.displayName = 'Display name is required';
      } else if (formData.displayName.length < 2) {
        newErrors.displayName = 'Display name must be at least 2 characters';
      }
    }

    if (activeTab === 'security') {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required';
      }
      if (!formData.newPassword) {
        newErrors.newPassword = 'New password is required';
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters';
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const updateData = {};

      if (activeTab === 'general') {
        updateData.displayName = formData.displayName;
      }

      if (activeTab === 'security') {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      if (activeTab === 'avatar') {
        updateData.avatarSettings = avatarSettings;
      }
      const result = await onUpdateProfile(updateData);

      if (result.success) {
        setSuccessMessage(result.message);
        if (activeTab === 'security') {
          setFormData(prev => ({
            ...prev,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }));
        }
      } else {
        setErrors({ general: result.message });
      }

    } catch (error) {
      console.error('Update error:', error);
      setErrors({ general: 'Failed to update profile. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', label: 'General', icon: 'settings' },
    { id: 'security', label: 'Security', icon: 'lock' },
    { id: 'avatar', label: 'Avatar', icon: 'camera_alt' }
  ];

  return (
    <>
      <div className="edit-profile-modal" ref={modalRef}>
        <div className="edit-profile-header">
            <div className="header-content">
              <h2>Edit Profile</h2>
              <p>Customize your Eclipse identity</p>
            </div>
            <button className="close-btn" onClick={onClose}>
              <span>✕</span>
            </button>
        </div>
        <div className="tab-navigation">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}>
                <span className="tab-icon material-symbols-outlined">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="edit-profile-content">
             {activeTab === 'general' && (
              <div className="tab-content">
                <div className="form-section">
                  <h3>Personal Information</h3>
                  <div className="form-group">
                    <label htmlFor="displayName">Display Name</label>
                    <div className="input-container">
                      <div className="input-icon">
                        <span className='material-symbols-outlined'>person_4</span>
                      </div>
                      <input
                        type="text"
                        id="displayName"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        placeholder="Enter your display name"
                        className={errors.displayName ? 'error' : ''}
                      />
                    </div>
                    {errors.displayName && (
                      <span className="error-message">{errors.displayName}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <div className="input-container disabled">
                      <div className="input-icon">
                        <span className='material-symbols-outlined'>email</span>
                      </div>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        placeholder="Email cannot be changed"
                      />
                     
                    </div>
                    <span className="input-note">Email address cannot be modified</span>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'security' && (
              <div className="tab-content">
                <div className="form-section">
                  <h3>Password Settings</h3>
                  <div className="security-warning">
                    <div className="warning-icon material-symbols-outlined">warning</div>
                    <div>
                      <p>Changing your password will log you out of all devices.</p>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <div className="input-container">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        id="currentPassword"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        placeholder="Enter current password"
                        className={errors.currentPassword ? 'error' : ''}
                      />
                      <button
                        type="button"
                        className="password-toggle material-symbols-outlined"
                        onClick={() => togglePasswordVisibility('current')}
                      >
                        {showPasswords.current ? 'visibility' : 'visibility_off'}
                      </button>
                    </div>
                    {errors.currentPassword && (
                      <span className="error-message">{errors.currentPassword}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <div className="input-container">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        id="newPassword"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        placeholder="Enter new password"
                        className={errors.newPassword ? 'error' : ''}
                      />
                      <button
                        type="button"
                        className="password-toggle material-symbols-outlined"
                        onClick={() => togglePasswordVisibility('new')}
                      >
                        {showPasswords.new ? 'visibility' : 'visibility_off'}
                      </button>
                    </div>
                    {errors.newPassword && (
                      <span className="error-message">{errors.newPassword}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <div className="input-container">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm new password"
                        className={errors.confirmPassword ? 'error' : ''}
                      />
                      <button
                        type="button"
                        className="password-toggle material-symbols-outlined"
                        onClick={() => togglePasswordVisibility('confirm')}
                      >
                        {showPasswords.confirm ? 'visibility' : 'visibility_off'}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <span className="error-message">{errors.confirmPassword}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'avatar' && (
              <div className="tab-content">
                <div className="form-section">
                  <h3>Customize Your Avatar</h3>

                  {/* Avatar Preview */}
                  <div className="avatar-preview-section">
                    <label>Preview</label>
                    <div className="avatar-preview-container">
                      <img
                        src={generateAvatarPreview()}
                        alt="Avatar preview"
                        className="avatar-preview"
                        key={`${avatarSettings.character}-${avatarSettings.backgroundColor}-${avatarSettings.foregroundColor}-${avatarSettings.useGradient}-${avatarSettings.gradientColor}-${avatarSettings.font}`}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="avatarCharacter">Character</label>
                    <div className="input-container">
                      <input
                        type="text"
                        id="avatarCharacter"
                        name="character"
                        value={avatarSettings.character}
                        onChange={handleCharacterChange}
                        placeholder="Enter a character"
                        maxLength="2"
                      />
                      <div className="input-icon">
                        <span className='material-symbols-outlined'>text_fields</span>
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="avatarFont">Font Family</label>
                    <div className="input-container">
                      <select
                        id="avatarFont"
                        name="font"
                        value={avatarSettings.font}
                        onChange={handleAvatarSettingChange}
                      >
                        <option value="Montserrat">Montserrat</option>
                        <option value="Roboto">Roboto</option>
                        <option value="OpenSans">Open Sans</option>
                        <option value="Lato">Lato</option>
                        <option value="SourceSansPro">Source Sans Pro</option>
                        <option value="Raleway">Raleway</option>
                        <option value="Ubuntu">Ubuntu</option>
                        <option value="PTSans">PT Sans</option>
                        <option value="Oswald">Oswald</option>
                        <option value="NotoSans">Noto Sans</option>
                      </select>
                      <div className="input-icon">
                        <span className='material-symbols-outlined'>font_download</span>
                      </div>
                    </div>
                  </div>
                  <div className="color-pickers-group">
                    <div className="form-group">
                      <label htmlFor="backgroundColor">Background Color</label>
                      <div className="color-picker-container">
                        <input
                          type="color"
                          id="backgroundColor"
                          name="backgroundColor"
                          value={avatarSettings.backgroundColor}
                          onChange={handleAvatarSettingChange}
                        />
                        <input
                          type="text"
                          value={avatarSettings.backgroundColor}
                          onChange={(e) => handleHexColorChange('backgroundColor', e.target.value)}
                          placeholder="#000000"
                          className="color-hex-input"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="foregroundColor">Text Color</label>
                      <div className="color-picker-container">
                        <input
                          type="color"
                          id="foregroundColor"
                          name="foregroundColor"
                          value={avatarSettings.foregroundColor}
                          onChange={handleAvatarSettingChange}
                        />
                        <input
                          type="text"
                          value={avatarSettings.foregroundColor}
                          onChange={(e) => handleHexColorChange('foregroundColor', e.target.value)}
                          placeholder="#FFFFFF"
                          className="color-hex-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="edit-profile-footer">
              <button type="button" className="cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="save-btn"
                disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
      </div>
      <NotificationModal
        isOpen={!!(errors.general || successMessage)}
        title={successMessage ? 'Success' : 'Error'}
        message={successMessage || errors.general || ''}
        type={successMessage ? 'success' : 'error'}
        showImage={false}
        onClose={() => {
          setErrors({ general: null });
          setSuccessMessage(null);
        }}
      />
    </>
  );
};

export default EditProfileModal;