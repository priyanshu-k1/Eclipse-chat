import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import './chats.css';
import applogo from '../assets/Eclipse-Logo.png';
import noContactsIllustration from '../assets/space-illustration.svg'

const Chats = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
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

  if (loading) {
    return (
      <div className="chats-container2">
        <p className="loading-text">Initializing your secure channel...</p>
        <p className="loading-text2">Thanks for your patience!</p>
      </div>
    );
  }

  return (
    <div className="chats-container">
      <div className="innerContainers contactsArea">
        {/* Hero Section */}
        <div className="heroSection">
          <div className="appBrand">
            <img src={applogo} alt="Eclipse Logo" />
            <h2>Eclipse Chat</h2>
          </div>
          <div className="userAvatar">
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
  );
};

export default Chats;
