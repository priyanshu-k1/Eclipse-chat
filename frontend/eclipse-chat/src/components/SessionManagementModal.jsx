import React, { useEffect, useState } from "react";
import "./SessionManagementModal.css";
import NotificationModal from "./NotificationModal";
const SessionManagementModal = ({isOpen}) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
//   const [isNotificationOpen, setIsNotificationOpen] = useState(false);
//   const [notificationMessage, setNotificationMessage] = useState("");
//   const [notificationType, setNotificationType] = useState("info");
    useEffect(() => {
        if (isOpen) {
            fetchSessions();
        }
    }, [isOpen]);
    const fetchSessions = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`http://localhost:5001/api/users/sessions`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch sessions');
            }

            const data = await response.json();
            setSessions(data.sessions || []);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching sessions:', err);
        } finally {
            setLoading(false);
        }
    };
   const terminateSession = async (sessionId) => {
    if (!sessionId) {
        setError('Invalid session ID');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`http://localhost:5001/api/users/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to terminate session');
        }
        
        setSessions(prev => prev.filter(session => session.id !== sessionId));
        
        setTimeout(() => {
           console.log('Session terminated successfully');
        }, 3000);

    } catch (err) {
        setError(err.message);
        console.error('Error terminating session:', err);
    }
};
    const terminateAllOtherSessions = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                const response = await fetch(`http://localhost:5001/api/users/sessions/others/all`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to terminate other sessions');
                }
                setSessions(prev => prev.filter(session => session.isCurrent));
                const successMessage = document.createElement('div');
                successMessage.textContent = 'All other sessions terminated successfully';
                successMessage.className = 'success-toast';
                document.body.appendChild(successMessage);
                setTimeout(() => {
                    if (document.body.contains(successMessage)) {
                        document.body.removeChild(successMessage);
                    }
                }, 3000);

            } catch (err) {
                setError(err.message);
                console.error('Error terminating other sessions:', err);
            }
    };

    const getDeviceIcon = (device) => {
            if (!device) return 'computer';
            
            const deviceLower = device.toLowerCase();
            if (deviceLower.includes('mobile') || deviceLower.includes('phone')) {
                if (deviceLower.includes('iphone')) {
                    return 'phone_iphone';
                } else if (deviceLower.includes('android')) {
                    return 'phone_android';
                }
                return 'smartphone';
            }
            if (deviceLower.includes('tablet') || deviceLower.includes('ipad')) {
                return 'tablet_mac';
            }
            if (deviceLower.includes('mac') || deviceLower.includes('macbook') || deviceLower.includes('imac')) {
                return 'desktop_mac';
            } else if (deviceLower.includes('windows') || deviceLower.includes('pc')) {
                return 'desktop_windows';
            } else if (deviceLower.includes('laptop')) {
                return 'laptop';
            } else if (deviceLower.includes('chrome') || deviceLower.includes('chromebook')) {
                return 'laptop_chromebook';
            }
            return 'computer';
    };
    const formatString = (inputString) => {
        if (typeof inputString !== 'string') {
            return ''; 
        }
        const trimmedString = inputString.trim();
        if (trimmedString.length === 0) {
            return trimmedString;
        }
        const capitalizedString =
            trimmedString.charAt(0).toUpperCase() + trimmedString.slice(1);
            return capitalizedString;
        }
        const formatDate = (dateString) => {
                try {
                    return new Date(dateString).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                } catch {
                    return 'Unknown';
        }
    };
    const clearError = () => {
        setError(null);
    };
  if (!isOpen) return null;
  return (
    <div className="modalOverlay">
        <div className="session-management-modal">
            <div className="modalheader">
                <h3>Connected Devices</h3>
                <p>Manage and secure all devices currently logged into your Eclipse account.</p>
            </div>
            <div className="modalContent">
                {loading && (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading sessions...</p>
                    </div>
                )}
                {error && (
                        <div className="error-state">
                            <p>❌ {error}</p>
                            <div className="error-actions">
                                <button className="retry-button" onClick={fetchSessions}>
                                    Try Again
                                </button>
                                <button className="clear-error-button" onClick={clearError}>
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    )}
                {  
                }
                {!loading && !error && (
                    sessions.length === 0 ? (
                        <div className="emptySession">
                            <span className="material-symbols-outlined">devices_off</span> 
                            <h2>No devices are currently connected.</h2>
                        </div>
                    ):(
                        <div className="deviceContainer">
                            {sessions.map((session) => (
                                <div className="deviceCard" key={session.id}>
                                    <div className="session-meta">
                                        <p className="session-time">
                                            Started: {formatDate(session.createdAt)}
                                        </p>
                                        <p className={"session-status"+(session.isCurrent ? " Current CurrentPElement" : " Inactive InactivePElement")}>{session.isCurrent ? 'Current' : 'Inactive'}</p>
                                    </div>
                                    <div className="deviceIconholder">
                                        <div className="innerHolder">
                                            <span className={"deviceIcon material-symbols-outlined"+(session.isCurrent ? " CurrentIcon" : " InactiveIcon")}>
                                                {getDeviceIcon(session.device)}
                                            </span>
                                        </div>
                                        <h4 className="device-name">{formatString(session.device) || 'Unknown Device'}</h4>
                                    </div>
                                    <div className="device-details">
                                        <p className="browser-info">{session.browser || 'Unknown Browser'}</p>
                                        <p className="os-info">{session.os || '`Unknown` OS'}</p>
                                    </div>
                                    <div className="buttonArea">
                                        <button className="terminateSession" onClick={() => terminateSession(session.id)}>
                                            Terminate Session
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>

        <div className="floatingDock">
                <button className="terminateAllSession"
                onClick={terminateAllOtherSessions}>
                    hello
                </button>
        </div>
    {/* <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        title="Notification"
        message={notificationMessage}
        type={notificationType || 'info'}
    /> */}
</div>

  );
};

export default SessionManagementModal;
