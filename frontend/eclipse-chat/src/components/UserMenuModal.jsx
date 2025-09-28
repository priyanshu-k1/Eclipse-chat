import React, { useRef, useEffect, useState} from 'react';
import './UserMenuModal.css';
import DeleteAccountModal from './DeleteAccountModal';
import EditProfileModal from './EditProfileModal';
import SessionManagementModal from './SessionManagementModal';

const UserMenuModal = ({ isOpen, onClose, user: propUser, onLogout, onDeleteAccount }) => {
  const modalRef = useRef(null);
  // const [user,setUser]=useState(user);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAchivementOpen,setIsAchivementOpen] = useState(true);
  const [isLogoutModalOpen,setLogoutModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      // document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);
  useEffect(() => {
    setIsAchivementOpen(true);
  }, [isOpen]);
  useEffect(() => {
    window.openEditProfile = () => {
      setIsEditProfileOpen(true);
      handleAchivementOpen();
    };

    return () => {
      delete window.openEditProfile;
    };
  });

  const handleSessionManagementClick = () => {
        setIsSessionModalOpen(!isSessionModalOpen);
  };

  const handleDeleteAccountClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteModalClose = () => {
    setIsDeleteModalOpen(false);
  };
  
  const handleUpdateProfile = async (updateData) => {
    try {
      const token = localStorage.getItem("token");
      let response = { success: true, message: "Profile updated successfully" };

      // Handle display name update
      if (updateData.displayName) {
        const res = await fetch("http://localhost:5001/api/users/update-displayName", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ displayName: updateData.displayName }),
        });

        const data = await res.json();
        if (!res.ok) {
          return { success: false, message: data.message };
        }
      }

      // Handle password update
      if (updateData.currentPassword && updateData.newPassword) {
        const res = await fetch("http://localhost:5001/api/users/update-password", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            oldPassword: updateData.currentPassword,
            newPassword: updateData.newPassword
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          return { success: false, message: data.message };
        }
      }

      if (updateData.avatarSettings) {
        const { character, font, backgroundColor, foregroundColor, useGradient, gradientColor } = updateData.avatarSettings;
        const cleanBg = backgroundColor?.replace('#', '') || '3B82F6';
        const cleanFg = foregroundColor?.replace('#', '') || 'FFFFFF';
        const cleanGradient = gradientColor?.replace('#', '') || '9333EA';

        const bgParam = useGradient ? `${cleanBg},${cleanGradient}` : cleanBg;
        const displayChar = character || 'EC';
        const fontName = font || 'Montserrat';

        const avatarUrl = `https://placehold.co/120x120/${bgParam}/${cleanFg}?text=${encodeURIComponent(displayChar)}&font=${encodeURIComponent(fontName)}`;
        console.log(avatarUrl)

        const res = await fetch("http://localhost:5001/api/users/update-profilePic", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ avatar: avatarUrl }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, message: data.message };
        }
      }

      return response;
    } catch (error) {
      console.error("Update profile error:", error);
      return { success: false, message: "Network error. Please try again." };
    }
  };

  const menuItems = [
    {
      id: 'profile',
      title: 'Edit Profile',
      description: 'Update your information',
      icon: 'person_4', 
      action: () => {
        if(isDeleteModalOpen){
            setIsDeleteModalOpen(false);
          }
        if(isAchivementOpen){
            setIsAchivementOpen(false);
        }
        setIsEditProfileOpen(true);
      },
      type: 'normal'
    },
    {
      id: 'Sessions',
      title: 'Manage Sessions',
      description: 'Manage your active sessions',
      icon: 'devices',
      action:()=>{
        if(isEditProfileOpen){
            setIsEditProfileOpen(false);
          }
        if(isDeleteModalOpen){
            setIsDeleteModalOpen(false);
          }
        if(isAchivementOpen){
            setIsAchivementOpen(false);
        }
        handleSessionManagementClick();
      },
      type: 'normal'
    },
    {
      id: 'logout',
      title: 'Log Out',
      description: 'Sign out of your account',
      icon: 'logout',
      action: () => {
        if(isEditProfileOpen){
            setIsEditProfileOpen(false);
          }
        if(isDeleteModalOpen){
            setIsDeleteModalOpen(false);
          }
        if(isAchivementOpen){
            setIsAchivementOpen(false);
        }
        setLogoutModalOpen(true);
      },
      type: 'normal'
    },
    {
      id: 'delete',
      title: 'Delete Account',
      description: 'Permanently remove account',
      icon: 'delete_forever',
      action:()=>{
        if(isEditProfileOpen){
            setIsEditProfileOpen(false);
        }
        if(isAchivementOpen){
            setIsAchivementOpen(false);
        }
        if(isLogoutModalOpen){
            setLogoutModalOpen(false);
        }
        handleDeleteAccountClick();
      },
      type: 'danger'
    },{
      id:'Terms of Service',
      title:'Terms of Service',
      description:'Read our terms of service',
      icon:'description',
      action:()=>{window.open("http://localhost:5001/terms-of-service","_blank")},
      type:'normal'
    },{
      id:'Privacy Policy',
      title:'Privacy Policy',
      description:'Read our privacy policy',
      icon:'privacy_tip',
      action:()=>{window.open("http://localhost:5001/privacy-policy","_blank")},
      type:'normal'
    }
  ];
  const handleAchivementOpen=()=>{
    if(isEditProfileOpen){
      setIsEditProfileOpen(false);
    }
    if(isDeleteModalOpen){
      setIsDeleteModalOpen(false);
    }
    setIsAchivementOpen(!isAchivementOpen)
  }
  if (!isOpen && !isDeleteModalOpen) return null;

  return (
    <>
      {isOpen && (
        <div className="user-menu-overlay">

          <button className="close-button" onClick={onClose}>
              <span className='material-symbols-outlined'>close</span> 
          </button>

          <div className="user-menu-modal" ref={modalRef}>
            {/* Header */}
            <div className="user-menu-header">
              <div className="user-info">
                <div className="user-avatar-large">
                  <img src={propUser?.avatar} alt="User Avatar" />
                  <div className="status-indicator"></div>
                  <div className="user-details">
                    <h3 className="user-display-name">{propUser?.displayName || "User"}</h3>
                    <div className="user-clipboard">
                      <p className="modal-user-name">{propUser?.eclipseId || "Celestial ID"} </p>
                      <i className="ph ph-clipboard" title='Copy to clipboard'  onClick={() => navigator.clipboard.writeText(propUser?.eclipseId || "NULL")}></i>
                    </div>
                    
                </div>
                </div>
              </div>
              <button className={isAchivementOpen?"hide-achivement-button":"achivement-button"} onClick={handleAchivementOpen} title={isAchivementOpen?'Hide achivement':'Show achivement'}>
                <span className="material-symbols-outlined">workspace_premium</span>
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
          {
            isLogoutModalOpen && !isAchivementOpen && !isEditProfileOpen && !isDeleteModalOpen && (
                <div className="logout-modal">
                  <div className="logout-modal-header">
                    <h3>Preparing Your Escape Pod</h3>
                  </div>
                  <div className="logout-modal-content">
                    <p>Prepare for logout sequence — shall we launch?</p>
                    <div className="modal-button-area ">
                      <button className="cancel-logout-button modal-buttons" onClick={()=>{
                        
                        setLogoutModalOpen(false);
                        setIsAchivementOpen(true);
                      }}>Nevermind</button>

                      <button className="confirm-logout-button modal-buttons" onClick={()=>{
                        setLogoutModalOpen(false);
                        onLogout();
                        onClose();
                      }}>Logout</button>
                    </div>
                  </div>
                </div>
            )
          }

          {isAchivementOpen && !isEditProfileOpen && !isDeleteModalOpen  && (
            <div className="userArea" >
              <div className="headersection">
                <h1>Command Deck</h1>
                <p>Welcome back, Commander <b>{propUser?.displayName || "Stargazer"}</b>. Your mission records await.</p>
              </div>
              <div className="bodysection">

              </div>
            </div>
          )}
          <SessionManagementModal 
                isOpen={isSessionModalOpen} 
                onClose={() => setIsSessionModalOpen(false)} 
          />
          <DeleteAccountModal
            isOpen={isDeleteModalOpen}
            onClose={
              ()=>{
                handleDeleteModalClose();
                setIsAchivementOpen(true);}
            }
            onDeleteAccount={onDeleteAccount}/>
          <EditProfileModal
            isOpen={isEditProfileOpen}
            onClose={() =>{
              setIsEditProfileOpen(false)
              setIsAchivementOpen(true);
            } }
            user={propUser}
            onUpdateProfile={handleUpdateProfile}/>
        </div>
      )}      
    </>
  );
};

export default UserMenuModal;