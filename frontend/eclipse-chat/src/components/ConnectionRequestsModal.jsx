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
      const response = await fetch(`http://localhost:5001/api/orbits/remove-connection/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
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

  // const handleOpenChat = (user) => {
  //   onClose(); // Close the modal first
  //   if (onUserSelect) {
  //     onUserSelect(user); // Open chat with the selected user
  //   }
  // };

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
        <div className="cosmic-loading">
          <div className="nebula-spinner"></div>
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
        <div className="void-state">
          <div className="void-icon">
            <i className="ph ph-shooting-star"></i>
          </div>
          <h3>No Incoming Signals</h3>
          <p>Your orbit is peaceful for now</p>
        </div>
      );
    }

    return (
      <div className="stellar-list">
        {pendingRequests.map((request) => {
          const sender = request?.sender || {};
          const requestId = request?.id || Math.random().toString();
          
          return (
            <div key={requestId} className="orbit-item">
              <div className="stellar-user">
                <div className="stellar-avatar">
                  {sender.avatar ? (
                    <img src={sender.avatar} alt={sender.displayName || 'User'} />
                  ) : (
                    <span className="stellar-initials">
                      {getInitials(sender.displayName)}
                    </span>
                  )}
                </div>
                <div className="stellar-user-data">
                  <h4 className="user-name">{sender.displayName || 'Unknown User'}</h4>
                  <p className="user-id">@{sender.eclipseId || 'unknown'}</p>
                </div>
              </div>
              
              <div className="stellar-actions">
                <button
                  className="stellar-btn stellar-reject"
                  onClick={() => handleRequestAction(requestId, 'deny')}
                  disabled={actionLoading[requestId]}
                  title="Reject request"
                >
                  {actionLoading[requestId] === 'deny' ? (
                    <div className="stellar-spinner"></div>
                  ) : (
                    <i className="ph ph-x"></i>
                  )}
                </button>
                <button
                  className="stellar-btn stellar-accept"
                  onClick={() => handleRequestAction(requestId, 'accept')}
                  disabled={actionLoading[requestId]}
                  title="Accept request"
                >
                  {actionLoading[requestId] === 'accept' ? (
                    <div className="stellar-spinner"></div>
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
      <div className="void-state">
        <div className="void-icon">
          <i className="ph ph-moon-stars"></i>
        </div>
        <h3>No Stellar Companions</h3>
        <p>Your constellation awaits new stars</p>
      </div>
    );
  }

  return (
    <div className="stellar-list">
      {connections.map((connection) => {
        const user = connection.user || {};
        const userId =  user.id;
        return (
          <div key={userId} className="orbit-item">
            <div className="stellar-user">
              <div className="stellar-avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.displayName || 'User'} />
                ) : (
                  <span className="stellar-initials">
                    {getInitials(user.displayName)}
                  </span>
                )}
                <div className="stellar-status"></div>
              </div>
              <div className="stellar-user-data">
                <h4 className="user-name">{user.displayName || 'Unknown User'}</h4>
                <p className="user-id">@{user.eclipseId || 'unknown'}</p>
              </div>
            </div>

            <div className="stellar-badge badge-connected">Connected</div>

            <div className="stellar-actions">
              <button
                className="stellar-btn stellar-remove"
                onClick={() => handleRemoveConnection(userId)} 
                disabled={actionLoading[userId]}
                title="Remove connection"
              >
                {actionLoading[userId] === 'remove' ? (
                  <div className="stellar-spinner"></div>
                ) : (
                  <i className="ph ph-user-minus"></i>
                )}
              </button>
              {/* <button 
                className="stellar-btn stellar-message" 
                title="Send message"
                onClick={() => handleOpenChat(user)}
              >
                <i className="ph ph-chat-circle"></i>
              </button> */}
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
        <div className="void-state">
          <div className="void-icon">
           <i class="ph ph-alien"></i>
          </div>
          <h3>No Rejected Signals</h3>
          <p>All cosmic requests are still in orbit</p>
        </div>
      );
    }

    return (
      <div className="stellar-list">
        {deniedRequests.map((request) => {
          const sender = request?.sender || {};
          const requestId = request?.id || Math.random().toString();
          
          return (
            <div key={requestId} className="orbit-item">
              <div className="stellar-user">
                <div className="stellar-avatar">
                  {sender.avatar ? (
                    <img src={sender.avatar} alt={sender.displayName || 'User'} />
                  ) : (
                    <span className="stellar-initials">
                      {getInitials(sender.displayName)}
                    </span>
                  )}
                </div>
                <div className="stellar-user-data">
                  <h4 className="user-name">{sender.displayName || 'Unknown User'}</h4>
                  <p className="user-id">@{sender.eclipseId || 'unknown'}</p>
                </div>
              </div>
              
              <div className="stellar-badge badge-denied">
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
    <div className="cosmic-overlay" onClick={onClose}>
      <div className="stellar-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="stellar-header">
          <div className="stellar-header-content">
            <div className="stellar-icon-container">
              <i className="ph ph-planet"></i>
            </div>
            <div className="stellar-title-section">
              <h2>Cosmic Network</h2>
              <p>Manage your stellar connections</p>
            </div>
          </div>
          <button className="stellar-close-btn" onClick={onClose}>
            <i className="ph ph-x"></i>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="stellar-navigation">
          <button
            className={`stellar-tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <i className="ph ph-radio"></i>
            <span>Incoming Signals</span>
            {Array.isArray(pendingRequests) && pendingRequests.length > 0 && (
              <span className="stellar-count">{pendingRequests.length}</span>
            )}
          </button>
          <button
            className={`stellar-tab ${activeTab === 'constellation' ? 'active' : ''}`}
            onClick={() => setActiveTab('constellation')}
          >
            <i className="ph ph-star"></i>
            <span>Constellation</span>
            {Array.isArray(connections) && connections.length > 0 && (
              <span className="stellar-count">{connections.length}</span>
            )}
          </button>
          <button
            className={`stellar-tab ${activeTab === 'blackhole' ? 'active' : ''}`}
            onClick={() => setActiveTab('blackhole')}
          >
            <i className="ph ph-prohibit"></i>
            <span>dwarf planet</span>
            {Array.isArray(deniedRequests) && deniedRequests.length > 0 && (
              <span className="stellar-count">{deniedRequests.length}</span>
            )}
          </button>
        </div>

        {/* Modal Content */}
        <div className="stellar-content">
          {renderTabContent()}
        </div>

        {/* Modal Footer */}
        <div className="stellar-footer">
          <p className="stellar-footer-text">
            {getFooterText()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConnectionRequestsModal;