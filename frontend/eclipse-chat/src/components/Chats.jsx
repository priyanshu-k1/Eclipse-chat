import { useEffect } from "react";
import { useNavigate } from "react-router-dom";


import './chats.css'

const Chats = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="chats-container">
      <h1>Welcome to Chats</h1>
      <p>You are now logged in and can access your private chats.</p>
    </div>
  );
};

export default Chats;
