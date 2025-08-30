import { useState, useEffect, useCallback } from 'react';
import './ConnectionRequestsModal.css';

const ConnectionRequestsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [deniedRequests, setDeniedRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const fetchPendingRequests = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5001/api/users/pending", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingRequests(data.requests || []);
      } else {
        console.error("Failed to fetch pending requests");
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConnections = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5001/api/users/connections", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections || []);
      } else {
        console.error("Failed to fetch connections");
      }
    } catch (error) {
      console.error("Error fetching connections:", error);
    }
  }, []);

  const fetchDeniedRequests = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5001/api/orbits/get-denied-list", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDeniedRequests(data.requests || []);
      } else {
        console.error("Failed to fetch denied requests");
      }
    } 
    catch (error) {
      console.error("Error fetching denied requests:", error);
    }
  }, []);
  
  useEffect(() => {
    const fetchAllData = async () => {
      await Promise.all([
        fetchPendingRequests(),
        fetchConnections(),
        fetchDeniedRequests()
      ]);
    };

    if (isOpen) {
      fetchAllData();
    }
  }, [isOpen, fetchPendingRequests, fetchConnections, fetchDeniedRequests]);

  const handleRequestAction = async (requestId, action) => {
    setActionLoading(prev => ({ ...prev, [requestId]: action }));
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5001/api/orbits/${requestId}/${action}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        if (action === 'accept') {
          const acceptedRequest = pendingRequests.find(req => req.id === requestId);
          if (acceptedRequest) {
            setPendingRequests(prev => prev.filter(req => req.id !== requestId));
            setConnections(prev => [...prev, {
              id: acceptedRequest.id,
              user: acceptedRequest.sender,
              status: 'connected'
            }]);
          }
        } else if (action === 'deny') {
          const deniedRequest = pendingRequests.find(req => req.id === requestId);
          if (deniedRequest) {
            setPendingRequests(prev => prev.filter(req => req.id !== requestId));
            setDeniedRequests(prev => [...prev, {
              ...deniedRequest,
              status: 'denied'
            }]);
          }
        }
      } else {
        console.error(`Failed to ${action} request`);
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

    const handleRemoveConnection = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: 'remove' }));
    
    try {
      const token = localStorage.getItem("token");
      // Fixed: Pass the user ID (not orbit ID) to match your backend logic
      const response = await fetch(`http://localhost:5001/api/orbits/remove-connection/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Remove the connection from the state by filtering out the connection with matching user ID
        setConnections(prev => prev.filter(conn => conn.user.id !== userId));
        console.log("Connection removed successfully");
      } else {
        const errorData = await response.json();
        console.error("Failed to remove connection:", errorData.message);
      }
    } catch (error) {
      console.error("Error removing connection:", error);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };
  const getInitials = (displayName) => {
    if (!displayName) return "?";
    return displayName
      .split(" ")
      .map(name => name[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading cosmic data...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'pending':
        return renderPendingRequests();
      case 'constellation':
        return renderConnections();
      case 'blackhole':
        return renderDeniedRequests();
      default:
        return null;
    }
  };

  const renderPendingRequests = () => {
    if (!Array.isArray(pendingRequests) || pendingRequests.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="ph ph-shooting-star"></i>
          </div>
          <h3>No Incoming Signals</h3>
          <p>Your orbit is peaceful for now</p>
        </div>
      );
    }

    return (
      <div className="requests-list">
        {pendingRequests.map((request) => {
          const sender = request?.sender || {};
          const requestId = request?.id || Math.random().toString();
          
          return (
            <div key={requestId} className="request-item">
              <div className="request-user">
                <div className="user-avatar">
                  {sender.avatar ? (
                    <img src={sender.avatar} alt={sender.displayName || 'User'} />
                  ) : (
                    <span className="avatar-initials">
                      {getInitials(sender.displayName)}
                    </span>
                  )}
                </div>
                <div className="user-info">
                  <h4 className="user-name">{sender.displayName || 'Unknown User'}</h4>
                  <p className="user-id">@{sender.eclipseId || 'unknown'}</p>
                </div>
              </div>
              
              <div className="request-actions">
                <button
                  className="action-btn reject-btn"
                  onClick={() => handleRequestAction(requestId, 'deny')}
                  disabled={actionLoading[requestId]}
                  title="Reject request"
                >
                  {actionLoading[requestId] === 'deny' ? (
                    <div className="btn-spinner"></div>
                  ) : (
                    <i className="ph ph-x"></i>
                  )}
                </button>
                <button
                  className="action-btn accept-btn"
                  onClick={() => handleRequestAction(requestId, 'accept')}
                  disabled={actionLoading[requestId]}
                  title="Accept request"
                >
                  {actionLoading[requestId] === 'accept' ? (
                    <div className="btn-spinner"></div>
                  ) : (
                    <i className="ph ph-check"></i>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

 const renderConnections = () => {
  if (!Array.isArray(connections) || connections.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <i className="ph ph-moon-stars"></i>
        </div>
        <h3>No Stellar Companions</h3>
        <p>Your constellation awaits new stars</p>
      </div>
    );
  }

  return (
    <div className="requests-list">
      {connections.map((connection) => {
        const user = connection.user || {};
        const userId =  user.id;
        return (
          <div key={userId} className="request-item">
            <div className="request-user">
              <div className="user-avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.displayName || 'User'} />
                ) : (
                  <span className="avatar-initials">
                    {getInitials(user.displayName)}
                  </span>
                )}
              </div>
              <div className="user-info">
                <h4 className="user-name">{user.displayName || 'Unknown User'}</h4>
                <p className="user-id">@{user.eclipseId || 'unknown'}</p>
              </div>
            </div>

            <div className="status-badge status-connected">Connected</div>

            <div className="request-actions">
              <button
                className="action-btn remove-btn"
                onClick={() => handleRemoveConnection(userId)} // ✅ orbit id
                disabled={actionLoading[userId]}
                title="Remove connection"
              >
                {actionLoading[userId] === 'remove' ? (
                  <div className="btn-spinner"></div>
                ) : (
                  <i className="ph ph-user-minus"></i>
                )}
              </button>
              <button className="action-btn message-btn" title="Send message">
                <i className="ph ph-chat-circle"></i>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};


  const renderDeniedRequests = () => {
    if (!Array.isArray(deniedRequests) || deniedRequests.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">
           <i class="ph ph-alien"></i>
          </div>
          <h3>No Rejected Signals</h3>
          <p>All cosmic requests are still in orbit</p>
        </div>
      );
    }

    return (
      <div className="requests-list">
        {deniedRequests.map((request) => {
          const sender = request?.sender || {};
          const requestId = request?.id || Math.random().toString();
          
          return (
            <div key={requestId} className="request-item">
              <div className="request-user">
                <div className="user-avatar">
                  {sender.avatar ? (
                    <img src={sender.avatar} alt={sender.displayName || 'User'} />
                  ) : (
                    <span className="avatar-initials">
                      {getInitials(sender.displayName)}
                    </span>
                  )}
                </div>
                <div className="user-info">
                  <h4 className="user-name">{sender.displayName || 'Unknown User'}</h4>
                  <p className="user-id">@{sender.eclipseId || 'unknown'}</p>
                </div>
              </div>
              
              <div className="status-badge status-denied">
                Rejected
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getFooterText = () => {
    switch (activeTab) {
      case 'pending':
        { const pendingCount = Array.isArray(pendingRequests) ? pendingRequests.length : 0;
        return `${pendingCount} incoming signal${pendingCount !== 1 ? 's' : ''}`; }
      case 'constellation':
        { const connectionsCount = Array.isArray(connections) ? connections.length : 0;
        return `${connectionsCount} stellar companion${connectionsCount !== 1 ? 's' : ''}`; }
      case 'blackhole':
        { const deniedCount = Array.isArray(deniedRequests) ? deniedRequests.length : 0;
        return `${deniedCount} rejected signal${deniedCount !== 1 ? 's' : ''}`; }
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="connection-modal-overlay" onClick={onClose}>
      <div className="connection-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="connection-modal-header">
          <div className="header-content">
            <div className="header-icon">
              <i className="ph ph-planet"></i>
            </div>
            <div className="header-text">
              <h2>Cosmic Network</h2>
              <p>Manage your stellar connections</p>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            <i className="ph ph-x"></i>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <i className="ph ph-radio"></i>
            <span>Incoming Signals</span>
            {Array.isArray(pendingRequests) && pendingRequests.length > 0 && (
              <span className="tab-count">{pendingRequests.length}</span>
            )}
          </button>
          <button
            className={`tab-button ${activeTab === 'constellation' ? 'active' : ''}`}
            onClick={() => setActiveTab('constellation')}
          >
            <i className="ph ph-star"></i>
            <span>Constellation</span>
            {Array.isArray(connections) && connections.length > 0 && (
              <span className="tab-count">{connections.length}</span>
            )}
          </button>
          <button
            className={`tab-button ${activeTab === 'blackhole' ? 'active' : ''}`}
            onClick={() => setActiveTab('blackhole')}
          >
            <i className="ph ph-prohibit"></i>
            <span>dwarf planet</span>
            {Array.isArray(deniedRequests) && deniedRequests.length > 0 && (
              <span className="tab-count">{deniedRequests.length}</span>
            )}
          </button>
        </div>

        {/* Modal Content */}
        <div className="connection-modal-content">
          {renderTabContent()}
        </div>

        {/* Modal Footer */}
        <div className="connection-modal-footer">
          <p className="footer-text">
            {getFooterText()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConnectionRequestsModal;