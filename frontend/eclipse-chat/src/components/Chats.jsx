import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import './chats.css';

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
    return <p>Checking authentication...</p>;
  }

  return (
    <div className="chats-container">
      <h1>Welcome <span className="user-name">{user?.displayName || "User"}</span></h1>
      <p>You are authenticated and can access your private chats.</p>
    </div>
  );
};

export default Chats;
