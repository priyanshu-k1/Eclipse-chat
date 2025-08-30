import React, { useState, useEffect, useRef, useCallback } from 'react';
import MessageBubble from './MessageBubble';
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
        console.error('Failed to fetch conversation');
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSaveMessage = async (messageId) => {
    console.log(messageId)
    try {
      const token = localStorage.getItem("token");
      const targetMessage = messages.find(msg => msg.id === messageId);
      const isFromMe = targetMessage?.sender?.eclipseId === currentUser?.eclipseId;
      const isSavedByMe = isFromMe ? targetMessage?.isSavedBySender : targetMessage?.isSavedByReceiver;
      
      // Determine if we're saving or unsaving
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
        // Update the message in state
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
        
        // Handle expiration timeout based on save status
        if (data.isSavedBySender && data.isSavedByReceiver) {
          // Both saved - clear expiration timeout
          const timeoutId = messageExpirationTimeoutsRef.current.get(messageId);
          if (timeoutId) {
            clearTimeout(timeoutId);
            messageExpirationTimeoutsRef.current.delete(messageId);
          }
        } else if (data.expiresAt) {
          // Message has expiration - set up timeout
          setupMessageExpirationTimeout({
            id: messageId,
            expiresAt: data.expiresAt
          });
        }
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Failed to update message');
      }
    } catch (error) {
      console.error('Error updating message:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || isSending || !selectedUser) return;

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
        if (res.status === 403) {
          alert(data.message); 
        } else {
          alert('Failed to send message. Please try again.');
        }
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