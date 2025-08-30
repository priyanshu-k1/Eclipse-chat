import React, { useState, useEffect, useRef, useCallback } from 'react';
import './MessageArea.css';

const MessageArea = ({ selectedUser, currentUser, onBack, onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const messageExpirationTimeoutsRef = useRef(new Map());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  // Function to check if a message has expired
  const isMessageExpired = (messageData) => {
    if (!messageData.expiresAt) return false;
    return new Date() >= new Date(messageData.expiresAt);
  };

  // Function to remove expired messages
  const removeExpiredMessages = useCallback(() => {
    setMessages(prevMessages => {
      const nonExpiredMessages = prevMessages.filter(msg => !isMessageExpired(msg));
      return nonExpiredMessages;
    });
  }, []);

  // Set up expiration timeouts for messages
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
      // Message is already expired, remove it immediately
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
        
        // Filter out expired messages and set up timeouts for others
        const validMessages = fetchedMessages.filter(msg => !isMessageExpired(msg));
        
        setMessages(validMessages);
        
        // Set up expiration timeouts for messages that have expiration times
        validMessages.forEach(msg => {
          if (msg.expiresAt) {
            setupMessageExpirationTimeout(msg);
          }
        });
      } else {
        console.error('Failed to fetch conversation');
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      setMessages([]);
    }
  }, [selectedUser, setupMessageExpirationTimeout]);

  // Initial fetch when user is selected
  useEffect(() => {
    if (selectedUser) {
      setIsLoading(true);
      fetchConversation().finally(() => setIsLoading(false));
    }
  }, [selectedUser, fetchConversation]);

  // Set up real-time polling for new messages
  useEffect(() => {
    if (!selectedUser) return;

    // Start polling every 2 seconds for new messages
    const startPolling = () => {
      pollingIntervalRef.current = setInterval(() => {
        fetchConversation();
      }, 2000);
    };

    startPolling();

    // Copy the ref value to a local variable for cleanup
    const timeoutsMap = messageExpirationTimeoutsRef.current;

    // Cleanup function
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      
      // Clear all message expiration timeouts
      timeoutsMap.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      timeoutsMap.clear();
    };
  }, [selectedUser, fetchConversation]);

  // Periodic cleanup for expired messages (runs every 30 seconds)
  useEffect(() => {
    const cleanupInterval = setInterval(removeExpiredMessages, 30000);
    
    return () => clearInterval(cleanupInterval);
  }, [removeExpiredMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || isSending || !selectedUser) return;

    setIsSending(true);
    const messageToSend = message.trim();
    
    // Optimistically add message to UI
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
        // Remove optimistic message on failure
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        
        console.error('Failed to send message:', data.message);
        if (res.status === 403) {
          alert(data.message); // Show orbit-related restrictions
        } else {
          alert('Failed to send message. Please try again.');
        }
        
        // Restore the message in input
        setMessage(messageToSend);
      } else {
        // Remove optimistic message and fetch fresh data
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        
        // Force immediate refresh to get the real message
        setTimeout(() => {
          fetchConversation();
        }, 100);

        // Notify parent component to refresh conversations list
        if (onMessageSent) {
          onMessageSent();
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setMessage(messageToSend);
      alert('Network error. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // Less than a week
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Format expiration countdown
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
      </div>
    );
  }

  return (
    <div className="message-area-container">
      <div className="chat-header">
        <div className="chat-user-info">
          <div className="chat-avatar">
            <img src={selectedUser.avatar} alt={selectedUser.displayName} />
          </div>
          <div className="chat-user-details">
            <h3>{selectedUser.displayName}</h3>
            {/* <span>@{selectedUser.eclipseId}</span>  have to fix this*/}
          </div>
        </div>
         <button className="back-button" onClick={onBack}>
          <i className="ph ph-x"></i>
        </button>
      </div>

      {/* Messages Container */}
      <div className="messages-container">
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
              <div 
                key={msg.id} 
                className={`message ${isMessageFromMe(msg) ? 'message-sent' : 'message-received'}`}
              >
                <div className="message-content">
                  <p>{msg.content}</p>
                  <span className="message-time">{formatTime(msg.timestamp)}</span>
                  {msg.expiresAt && (
                    <span className="message-expires">
                      <i className="ph ph-clock"></i> 
                      <span>{formatExpirationTime(msg.expiresAt)}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="message-input-container">
        <form onSubmit={handleSendMessage} className="message-form">
          <div className="input-wrapper">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`Send an encrypted message to ${selectedUser.displayName}...`}
              className="message-input"
              rows="1"
              disabled={isSending}
            />
            <button 
              type="submit" 
              className={`send-button ${message.trim() && !isSending ? 'active' : ''}`}
              disabled={!message.trim() || isSending}
            >
              {isSending ? (
                <div className="send-spinner"></div>
              ) : (
                <i className="ph ph-paper-plane-tilt"></i>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MessageArea;