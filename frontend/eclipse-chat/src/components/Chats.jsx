import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import './chats.css';
import applogo from '../assets/Eclipse-Logo.png';
import noContactsIllustration from '../assets/space-illustration.svg';
import UserMenuModal from './UserMenuModal'; 
import EditProfileModal from './EditProfileModal'; 

const Chats = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false); 

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        // Updated to use correct endpoint - change this to your auth verification endpoint
        const res = await fetch("http://localhost:5001/api/auth/verify", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error("Verify error:", err);
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    window.openEditProfile = () => {
      setIsEditProfileOpen(true);
    };
    
    return () => {
      delete window.openEditProfile;
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
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
        if (res.ok) {
          setUser(data.user);
        } else {
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

      // Handle avatar update using existing updateProfilePic endpoint
      if (updateData.avatarSettings) {
        const { character, font, backgroundColor, foregroundColor, useGradient, gradientColor } = updateData.avatarSettings;
        
        // Generate avatar URL from settings
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
        if (res.ok) {
          setUser(data.user);
        } else {
          return { success: false, message: data.message };
        }
      }

      return response;
    } catch (error) {
      console.error("Update profile error:", error);
      return { success: false, message: "Network error. Please try again." };
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async (password) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5001/api/users/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.removeItem("token");
        navigate("/login");
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error("Delete account error:", error);
      return { success: false, message: "Network error. Please try again." };
    }
  };

  if (loading) {
    return (
      <div className="chats-container2">
        <p className="loading-text">Initializing your secure channel...</p>
        <p className="loading-text2">Thanks for your patience!</p>
      </div>
    );
  }

  return (
    <>
      <div className="chats-container">
        <div className="innerContainers contactsArea">
          {/* Hero Section */}
          <div className="heroSection">
            <div className="appBrand">
              <img src={applogo} alt="Eclipse Logo" />
              <h2>Eclipse Chat</h2>
            </div>
            <div className="userAvatar" onClick={handleMenuToggle}>
              <img src={user?.avatar} alt="User Avatar" />
            </div>
          </div>
          {/* Chats + Search */}
          <div className="chats">
            <div className="searchArea">
              <h3>Chats</h3>
              <input type="text" placeholder="Search chats..." className="searchContacts"/>
            </div>
            <div className="contacts emptyState">
                <img src={noContactsIllustration} alt="No Contacts Illustration" className="empty-illustration"/>
                <p className="empty-text">No one to orbit yet...</p>
                <span className="empty-subtext">Start a new chat and grow your galaxy</span>
            </div>
          </div>
        </div>
        <div className="messageArea">
          <div className="welcome-container">
            <div className="welcome-header">
              <img src={applogo} alt="Eclipse Logo" />
              <h1 className="welcome-title">
                Welcome back, <span className="user-name">{user?.displayName || "User"}</span>
              </h1>
              <p className="welcome-subtitle">Your private space awaits</p>
            </div>
          </div>
        </div>
      </div>

      {/* User Menu Modal */}
      <UserMenuModal 
        isOpen={isMenuOpen}
        onClose={handleCloseMenu}
        user={user}
        onLogout={handleLogout}
        onDeleteAccount={handleDeleteAccount}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        user={user}
        onUpdateProfile={handleUpdateProfile}
      />
    </>
  );
};

export default Chats;