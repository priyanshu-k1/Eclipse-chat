/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

import MessageBubble from './MessageBubble';
import ParticlesBackground from './ParticlesBackground';
import NotificationModal from './NotificationModal';
import './MessageArea.css';
import backgroundDoodle from '../assets/chatbackground.svg';
import AddFriendPopup from './AddFriendPopup'

const GalaxyStatusCard = ({ currentUser, accountStats, onlineUsers, connections }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const statusMessages = [
    `Exploring since ${accountStats?.accountAge?.readable || 'unknown'}`,
    `Currently orbiting ${connections?.length || 0} travelers`,
    `Encrypted galaxy: secure & expanding`,
    `${onlineUsers?.length || 0} explorers online`
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % statusMessages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [statusMessages.length]);

  return (
    <div 
      className={`galaxy-status-card ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      {/* Animated background stars */}
      <div className="status-card-stars">
        <div className="status-star" style={{ left: '10%', animationDelay: '0s' }}></div>
        <div className="status-star" style={{ left: '30%', animationDelay: '1s' }}></div>
        <div className="status-star" style={{ left: '60%', animationDelay: '2s' }}></div>
        <div className="status-star" style={{ left: '80%', animationDelay: '1.5s' }}></div>
      </div>

      {/* Orbit animation container */}
      <div className="orbit-container">
        {/* Central avatar */}
        <div className="central-avatar">
          <img src={currentUser?.avatar} alt={currentUser?.displayName} />
        </div>

        {/* Orbit rings */}
        <div className="orbit-ring orbit-ring-1">
          <div className="satellite satellite-1">
            <i className="ph ph-planet"></i>
          </div>
        </div>

        {connections && connections.length > 1 && (
          <div className="orbit-ring orbit-ring-2">
            <div className="satellite satellite-2">
              <i className="ph ph-rocket"></i>
            </div>
          </div>
        )}

        {connections && connections.length > 2 && (
          <div className="orbit-ring orbit-ring-3">
            <div className="satellite satellite-3">
              <i className="ph ph-shooting-star"></i>
            </div>
          </div>
        )}
      </div>

      {/* Status text */}
      <div className="status-text">
        <span className="material-symbols-outlined">emoji_objects</span>
        <span className="status-message">
          {statusMessages[currentMessageIndex]}
        </span>
      </div>

      {/* Pulse indicator */}
      <div className="pulse-indicator">
        <div className="pulse-dot"></div>
      </div>
    </div>
  );
};

const MessageArea = ({ selectedUser, currentUser, onBack, onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [userStatus, setUserStatus] = useState('offline');
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [accountStats, setAccountStats] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connections, setConnections] = useState([]);

  // Add friend popup states
  const [relationshipStatus, setRelationshipStatus] = useState(null);
  const [showAddFriendPopup, setShowAddFriendPopup] = useState(false);
  const [isCheckingRelationship, setIsCheckingRelationship] = useState(false);

  // Notification modal state
  const [notification, setNotification] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const messageExpirationTimeoutsRef = useRef(new Map());
  const socketRef = useRef(null);

  // Show notification function
  const showNotification = (title, message, type = 'info') => {
    setNotification({
      isOpen: true,
      title,
      message,
      type
    });
  };

  // Close notification function
  const closeNotification = () => {
    setNotification(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  // Get notification title and type based on error type
  const getNotificationConfig = (responseData) => {
    const { type, message } = responseData;
    switch (type) {
      case 'orbit_denied':
        return {
          title: 'Orbit Request Denied',
          type: 'warning'
        };
      case 'message_limit_reached':
        return {
          title: 'Message Limit Reached',
          type: 'warning'
        };
      case 'user_not_found':
        return {
          title: 'User Not Found',
          type: 'error'
        };
      case 'validation_error':
        return {
          title: 'Validation Error',
          type: 'error'
        };
      case 'authorization_error':
        return {
          title: 'Authorization Error',
          type: 'error'
        };
      case 'error':
        return {
          title: 'Error',
          type: 'error'
        };
      case 'success':
        return {
          title: 'Success',
          type: 'info'
        };
      default:
        return {
          title: 'Notification',
          type: 'info'
        };
    }
  };

// Check relationship status with selected user
  const checkRelationshipStatus = async (userId) => {
    if (!userId || !currentUser) return;
    setIsCheckingRelationship(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5001/api/orbits/check-relationship/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setRelationshipStatus(data.status);
        setShowAddFriendPopup(data.status === 'none');
      } else {
        const errorData = await res.json();
        console.error('Error checking relationship status:', errorData.message);
        setRelationshipStatus('none');
        setShowAddFriendPopup(true);
      }
    } catch (error) {
      console.error('Error checking relationship status:', error);
      setRelationshipStatus('none');
      setShowAddFriendPopup(true);
    } finally {
      setIsCheckingRelationship(false);
    }
  };

  // Send friend request
  const handleSendFriendRequest = async () => {
    if (!selectedUser || !currentUser) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5001/api/orbits/send-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: selectedUser.id
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setRelationshipStatus('pending_sent');
        setShowAddFriendPopup(false);
        showNotification('Request Sent', `Orbit request sent to ${selectedUser.displayName}`, 'success');
      } else {
        const config = getNotificationConfig(data);
        showNotification(config.title, data.message, config.type);
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      showNotification('Network Error', 'Failed to send orbit request', 'error');
    }
  };

  // Handle closing add friend popup
  const handleCloseAddFriendPopup = () => {
    setShowAddFriendPopup(false);
  };

  // Check relationship status when selectedUser changes
  useEffect(() => {
    if (selectedUser && currentUser) {
      // Reset states
      setRelationshipStatus(null);
      setShowAddFriendPopup(false);
      
      // Check relationship status
      checkRelationshipStatus(selectedUser.id);
    }
  }, [selectedUser, currentUser]);

  // Improved scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 50);
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedUser) {
        onBack();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedUser, onBack]);

  // Fetch account stats and connections for status card
  useEffect(() => {
    if (currentUser) {
      fetchAccountStats();
      fetchOnlineUsers();
      fetchConnections();
    }
  }, [currentUser]);

  const fetchAccountStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5001/api/users/account-stats', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setAccountStats(data.accountStats);
      } else {
        const errorData = await res.json();
        const config = getNotificationConfig(errorData);
        showNotification(config.title, errorData.message, config.type);
      }
    } catch (error) {
      console.error('Error fetching account stats:', error);
      showNotification('Network Error', 'Failed to fetch account statistics', 'error');
    }
  };

  const fetchOnlineUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5001/api/users/online-users', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setOnlineUsers(data.onlineUsers || []);
      } else {
        const errorData = await res.json();
        const config = getNotificationConfig(errorData);
        showNotification(config.title, errorData.message, config.type);
      }
    } catch (error) {
      console.error('Error fetching online users:', error);
      showNotification('Network Error', 'Failed to fetch online users', 'error');
    }
  };

  const fetchConnections = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5001/api/users/connections', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections || []);
      } else {
        const errorData = await res.json();
        const config = getNotificationConfig(errorData);
        showNotification(config.title, errorData.message, config.type);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
      showNotification('Network Error', 'Failed to fetch connections', 'error');
    }
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    socketRef.current = io('http://localhost:5001', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    // Authenticate user for presence tracking
    socketRef.current.emit('user_authenticated', {
      eclipseId: currentUser.eclipseId,
      username: currentUser.displayName || currentUser.username
    });

    // Listen for user status updates
    socketRef.current.on('user_status_update', (data) => {
      if (selectedUser && data.eclipseId === selectedUser.eclipseId) {
        setUserStatus(data.status);
      }
    });

    // Listen for online users list
    socketRef.current.on('online_users_list', (onlineUsers) => {
      if (selectedUser) {
        const user = onlineUsers.find(u => u.eclipseId === selectedUser.eclipseId);
        setUserStatus(user ? user.status : 'offline');
      }
      setOnlineUsers(onlineUsers);
    });

    // Listen for typing indicators
    socketRef.current.on('user_typing', (data) => {
      if (selectedUser && data.eclipseId === selectedUser.eclipseId) {
        setIsUserTyping(data.isTyping);
      }
    });

    // Send periodic ping to maintain active status
    const pingInterval = setInterval(() => {
      if (socketRef.current) {
        socketRef.current.emit('ping');
      }
    }, 30000); 

    return () => {
      clearInterval(pingInterval);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [currentUser, selectedUser]);

  // Update user status when selectedUser changes
  useEffect(() => {
    if (selectedUser && socketRef.current) {
      // Check if selected user is online
      socketRef.current.emit('check_user_status', { eclipseId: selectedUser.eclipseId });
    }
  }, [selectedUser]);

  // Join room for private messaging
  useEffect(() => {
    if (selectedUser && socketRef.current && currentUser) {
      const roomId = [currentUser.eclipseId, selectedUser.eclipseId].sort().join('_');
      socketRef.current.emit('join_room', roomId);
    }
  }, [selectedUser, currentUser]);

  const isMessageExpired = (messageData) => {
    if (!messageData.expiresAt) return false;
    return new Date() >= new Date(messageData.expiresAt);
  };

  const removeExpiredMessages = useCallback(() => {
    setMessages(prevMessages => {
      const nonExpiredMessages = prevMessages.filter(msg => !isMessageExpired(msg));
      return nonExpiredMessages;
    });
  }, []);

  const setupMessageExpirationTimeout = useCallback((messageData) => {
    if (!messageData.expiresAt) return;

    const expirationTime = new Date(messageData.expiresAt);
    const currentTime = new Date();
    const timeUntilExpiration = expirationTime.getTime() - currentTime.getTime();

    if (timeUntilExpiration > 0) {
      const timeoutId = setTimeout(() => {
        setMessages(prevMessages =>
          prevMessages.filter(msg => msg.id !== messageData.id)
        );
        messageExpirationTimeoutsRef.current.delete(messageData.id);
      }, timeUntilExpiration);

      messageExpirationTimeoutsRef.current.set(messageData.id, timeoutId);
    } else {
      setMessages(prevMessages =>
        prevMessages.filter(msg => msg.id !== messageData.id)
      );
    }
  }, []);

  const fetchConversation = useCallback(async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5001/api/messages/conversation/${selectedUser.eclipseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        const fetchedMessages = data.messages || [];
        const validMessages = fetchedMessages.filter(msg => !isMessageExpired(msg));
        setMessages(validMessages);
        validMessages.forEach(msg => {
          if (msg.expiresAt) {
            setupMessageExpirationTimeout(msg);
          }
        });
      } else {
        const errorData = await res.json();
        const config = getNotificationConfig(errorData);
        showNotification(config.title, errorData.message, config.type);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      showNotification('Network Error', 'Failed to load conversation', 'error');
      setMessages([]);
    }
  }, [selectedUser, setupMessageExpirationTimeout]);

  useEffect(() => {
    if (selectedUser) {
      setIsLoading(true);
      fetchConversation().finally(() => setIsLoading(false));
    }
  }, [selectedUser, fetchConversation]);

  useEffect(() => {
    if (!selectedUser) return;
    const startPolling = () => {
      pollingIntervalRef.current = setInterval(() => {
        fetchConversation();
      }, 2000);
    };
    startPolling();
    const timeoutsMap = messageExpirationTimeoutsRef.current;
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      timeoutsMap.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      timeoutsMap.clear();
    };
  }, [selectedUser, fetchConversation]);

  useEffect(() => {
    const cleanupInterval = setInterval(removeExpiredMessages, 30000);
    return () => clearInterval(cleanupInterval);
  }, [removeExpiredMessages]);

  const handleSaveMessage = async (messageId) => {
    console.log(messageId)
    try {
      const token = localStorage.getItem("token");
      const targetMessage = messages.find(msg => msg.id === messageId);
      const isFromMe = targetMessage?.sender?.eclipseId === currentUser?.eclipseId;
      const isSavedByMe = isFromMe ? targetMessage?.isSavedBySender : targetMessage?.isSavedByReceiver;

      const endpoint = isSavedByMe ? 'unsave' : 'save';

      const res = await fetch(`http://localhost:5001/api/messages/${endpoint}/${messageId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === messageId
              ? {
                ...msg,
                isSavedBySender: data.isSavedBySender,
                isSavedByReceiver: data.isSavedByReceiver,
                expiresAt: data.expiresAt
              }
              : msg
          )
        );

        if (data.isSavedBySender && data.isSavedByReceiver) {
          const timeoutId = messageExpirationTimeoutsRef.current.get(messageId);
          if (timeoutId) {
            clearTimeout(timeoutId);
            messageExpirationTimeoutsRef.current.delete(messageId);
          }
        } else if (data.expiresAt) {
          setupMessageExpirationTimeout({
            id: messageId,
            expiresAt: data.expiresAt
          });
        }

        // Show success notification
        const config = getNotificationConfig(data);
        showNotification(config.title, data.message, config.type);
      } else {
        const errorData = await res.json();
        const config = getNotificationConfig(errorData);
        showNotification(config.title, errorData.message, config.type);
      }
    } catch (error) {
      console.error('Error updating message:', error);
      showNotification('Network Error', 'Failed to update message', 'error');
    }
  };

  const handleSendMessage = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!message.trim() || isSending || !selectedUser) return;

    // Check if we can send messages (only if they're friends or have pending/accepted connection)
    if (relationshipStatus === 'none') {
      showNotification('Orbit Required', 'You need to establish an orbit connection to send messages', 'warning');
      return;
    }

    setIsSending(true);
    const messageToSend = message.trim();
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      content: messageToSend,
      timestamp: new Date().toISOString(),
      sender: currentUser,
      recipient: selectedUser,
      isOptimistic: true
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setMessage('');

    // Stop typing indicator
    if (socketRef.current && selectedUser) {
      socketRef.current.emit('typing_stop', { recipientEclipseId: selectedUser.eclipseId });
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch('http://localhost:5001/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientEclipseId: selectedUser.eclipseId,
          content: messageToSend
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));

        console.error('Failed to send message:', data.message);
        const config = getNotificationConfig(data);
        showNotification(config.title, data.message, config.type);
        setMessage(messageToSend);
      } else {
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        setTimeout(() => {
          fetchConversation();
        }, 100);
        if (onMessageSent) {
          onMessageSent();
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setMessage(messageToSend);
      showNotification('Network Error', 'Failed to send message', 'error');
    } finally {
      setIsSending(false);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleSendMessage(e);
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    // Send user activity to maintain online status
    if (socketRef.current) {
      socketRef.current.emit('user_activity');
    }

    // Handle typing indicators
    if (!isTyping && socketRef.current && selectedUser) {
      setIsTyping(true);
      socketRef.current.emit('typing_start', { recipientEclipseId: selectedUser.eclipseId });
    }

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set new timeout to stop typing
    const newTimeout = setTimeout(() => {
      setIsTyping(false);
      if (socketRef.current && selectedUser) {
        socketRef.current.emit('typing_stop', { recipientEclipseId: selectedUser.eclipseId });
      }
    }, 1000);

    setTypingTimeout(newTimeout);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const formatExpirationTime = (expiresAt) => {
    const expirationTime = new Date(expiresAt);
    const currentTime = new Date();
    const timeLeft = expirationTime.getTime() - currentTime.getTime();

    if (timeLeft <= 0) return 'Expired';

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const isMessageFromMe = (messageData) => {
    return messageData.sender.eclipseId === currentUser.eclipseId;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return '#4ade80'; 
      case 'idle':
        return '#fbbf24'; 
      case 'away':
        return '#f59e0b';
      case 'offline':
      default:
        return '#ef4444';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'idle':
        return 'Idle';
      case 'away':
        return 'Away';
      case 'offline':
      default:
        return 'Offline';
    }
  };

  // Get custom message for add friend popup based on relationship status
  const getAddFriendMessage = () => {
    if (!selectedUser) return '';
    
    const messages = [
      `Ready to create an orbit with ${selectedUser.displayName}?`,
      `Establish a cosmic connection with ${selectedUser.displayName}`,
      `Begin your encrypted orbit with ${selectedUser.displayName}`,
      `Connect across the galaxy with ${selectedUser.displayName}`,
      `Create a stellar bond with ${selectedUser.displayName}`
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  };

  if (!selectedUser) {
    return (
      <div className="message-area-container">
        <div className="welcome-container">
          <div className="welcome-header">
            <h1 className="welcome-title">
              Welcome back, <span className="user-name">{currentUser?.displayName || "User"}</span>
            </h1>
            <p className="welcome-subtitle">Your encrypted galaxy awaits exploration</p>
          </div>
        </div>
        <GalaxyStatusCard 
          currentUser={currentUser}
          accountStats={accountStats}
          onlineUsers={onlineUsers}
          connections={connections}
        />
        {/* Notification Modal */}
        <NotificationModal
          isOpen={notification.isOpen}
          onClose={closeNotification}
          title={notification.title}
          message={notification.message}
          type={notification.type}
        />
      </div>
    );
  }

  return (
    <div className="message-area-container" 
        style={
          {backgroundImage: `url(${backgroundDoodle})`}
          }>
      <div className="chat-header">
        <div className="chat-user-info">
          <div className="chat-avatar">
            <img src={selectedUser.avatar} alt={selectedUser.displayName} />
          </div>
          <div className="chat-user-details">
            <h3>{selectedUser.displayName}</h3>
            <div className="user-status" style={{ color: getStatusColor(userStatus) }}>
              <span className="status-dot" style={{ backgroundColor: getStatusColor(userStatus) }}></span>
              {getStatusText(userStatus)}
            </div>
          </div>
        </div>
        <button className="back-button" onClick={onBack}>
          <i className="ph ph-x"></i>
        </button>
      </div>

      <div className="messages-container" ref={messagesContainerRef}>
        {isLoading ? (
          <div className="loading-messages">
            <div className="loading-spinner"></div>
            <p>Decrypting messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-conversation">
            <div className="empty-conversation-icon">
              <i className="ph ph-chat-circle"></i>
            </div>
            <h3>Start your orbit</h3>
            <p>Begin your encrypted conversation with {selectedUser.displayName}</p>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isFromMe={isMessageFromMe(msg)}
                formatTime={formatTime}
                formatExpirationTime={formatExpirationTime}
                onSaveMessage={handleSaveMessage}
                currentUser={currentUser}
              />
            ))}

            {/* Typing indicator */}
            {isUserTyping && (
              <div className="typing-indicator">
                <div className="typing-avatar">
                  <img src={selectedUser.avatar} alt={selectedUser.displayName} />
                </div>
                <div className="typing-bubble">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <div className="typing-text">{selectedUser.displayName} is typing...</div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Add Friend Popup - only show if not friends and not loading */}
      {showAddFriendPopup && !isCheckingRelationship && relationshipStatus === 'none' && (
        <AddFriendPopup 
          onAccept={handleSendFriendRequest}
          onClose={handleCloseAddFriendPopup}
          username={selectedUser.displayName}
          customMessage={getAddFriendMessage()}
          isVisible={true}
        />
      )}

      <div className="message-input-container">
        <form onSubmit={handleSendMessage} className="message-form">
          <div className="input-wrapper">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                relationshipStatus === 'none' 
                  ? `Send an orbit request to ${selectedUser.displayName} to start messaging...`
                  : relationshipStatus === 'pending_sent'
                  ? `Waiting for ${selectedUser.displayName} to accept your orbit request...`
                  : relationshipStatus === 'pending_received'
                  ? `${selectedUser.displayName} sent you an orbit request. Check your notifications.`
                  : `Send an encrypted message to ${selectedUser.displayName}...`
              }
              className="message-input"
              rows="1"
              disabled={isSending || relationshipStatus === 'none' || relationshipStatus === 'pending_sent' || relationshipStatus === 'pending_received'}
            />
            <button
              type="submit"
              className={`send-button ${message.trim() && !isSending && relationshipStatus === 'friends' ? 'active' : ''}`}
              disabled={!message.trim() || isSending || relationshipStatus !== 'friends'}
              title={
                relationshipStatus === 'none'
                  ? 'Send orbit request first'
                  : relationshipStatus === 'pending_sent'
                  ? 'Waiting for orbit acceptance'
                  : relationshipStatus === 'pending_received'
                  ? 'Accept orbit request to send messages'
                  : 'Send message'
              }
            >
              {isSending ? (
                <div className="send-spinner"></div>
              ) : relationshipStatus === 'none' ? (
                <i className="ph ph-user-plus"></i>
              ) : relationshipStatus === 'pending_sent' || relationshipStatus === 'pending_received' ? (
                <i className="ph ph-clock"></i>
              ) : (
                <i className="ph ph-paper-plane-tilt"></i>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </div>
  );
};

export default MessageArea;