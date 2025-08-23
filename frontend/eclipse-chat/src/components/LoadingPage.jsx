import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./LoadingPage.css";

const LoadingPage = () => {
  const navigate = useNavigate();
  const [loadingMessage, setLoadingMessage] = useState("Initializing Eclipse Chat...");

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setTimeout(() => {
          navigate("/LandingPage");
        }, 1000);
        return;
      }

      try {
        setLoadingMessage("Verifying your session...");
        
        const res = await fetch("http://localhost:5001/api/auth/verify", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          localStorage.removeItem("token");
          setLoadingMessage("Session expired. Redirecting...");
          setTimeout(() => {
            navigate("/LandingPage");
          }, 1500);
          return;
        }

        setLoadingMessage("Welcome back! Loading your chats...");
        setTimeout(() => {
          navigate("/chats");
        }, 2000);

      } catch (err) {
        console.error("Auth check error:", err);
        localStorage.removeItem("token");
        setLoadingMessage("Connection error. Redirecting...");
        setTimeout(() => {
          navigate("/LandingPage");
        }, 1500);
      }
    };

    checkAuth();
  }, [navigate]);

  return (
    <div className="loading-page">
      <div className="stars"></div>
      
      <div className="loading-container">
        <div className="eclipse-loader">
          <div className="eclipse-outer">
            <div className="eclipse-inner"></div>
          </div>
          <div className="eclipse-glow"></div>
        </div>
        
        <div className="loading-content">
          <h1 className="brand-title">Eclipse Chat</h1>
          <p className="loading-message">{loadingMessage}</p>
          
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
          
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
      
      <div className="bottom-tagline">
        <p><span className="btn-icon material-symbols-outlined">shield_locked</span>Privacy-first • Secure • Ephemeral</p>
      </div>
    </div>
  );
};

export default LoadingPage;