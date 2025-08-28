import { useState, useEffect } from "react";
import './requestsmodal.css';

const RequestsModal = ({ isOpen, onClose, user }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchPendingRequests();
    }
  }, [isOpen, user]);

  const fetchPendingRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found.");
        setLoading(false);
        return;
      }

      const res = await fetch("http://localhost:5001/api/user/requests/pending", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch requests.");
      }

      const data = await res.json();
      setRequests(data.requests);
    } catch (err) {
      console.error("Error fetching pending requests:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Incoming Transmissions</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {loading && <div className="loading-state">Loading requests...</div>}
          {error && <div className="error-state">{error}</div>}
          {!loading && !error && requests.length === 0 && (
            <div className="empty-state">No new transmissions. All systems are clear.</div>
          )}
          {!loading && requests.length > 0 && (
            <ul className="requests-list">
              {requests.map((request) => (
                <li key={request.id} className="request-item">
                  <div className="sender-info">
                    <img src={request.sender.avatar} alt={`${request.sender.displayName}'s avatar`} className="sender-avatar" />
                    <div className="sender-details">
                      <span className="sender-display-name">{request.sender.displayName}</span>
                      <span className="sender-eclipse-id">#{request.sender.eclipseId}</span>
                    </div>
                  </div>
                  <div className="request-actions">
                    <button className="accept-button">Accept</button>
                    <button className="decline-button">Decline</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestsModal;
