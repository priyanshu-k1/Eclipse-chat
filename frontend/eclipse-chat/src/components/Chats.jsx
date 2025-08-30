import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import './chats.css';
import applogo from '../assets/Eclipse-Logo.png';
import noContactsIllustration from '../assets/space-illustration.svg';
import UserMenuModal from './UserMenuModal';
import EditProfileModal from './EditProfileModal';
import UserSearch from './UserSearch';
import ConnectionRequestsModal from './ConnectionRequestsModal';
import MessageArea from './MessageArea';

const Chats = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isConnectionRequestsOpen, setIsConnectionRequestsOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [setShowSearch] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  
  // Track previous conversations to detect new ones and manage unread state
  const prevConversationsRef = useRef([]);
  const [newConversationIds, setNewConversationIds] = useState(new Set());
  const [unreadConversations, setUnreadConversations] = useState(new Set());
  const lastSeenMessages = useRef(new Map()); // Track last seen message for each conversation

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
        await fetchPendingRequestsCount();
        await fetchConversations(true); // Show loading on initial fetch
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

  const fetchPendingRequestsCount = async () => {
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
        setPendingRequestsCount(data.requests ? data.requests.length : 0)
      }
    } catch (error) {
      console.error("Error fetching pending requests count:", error);
    }
  };

  const fetchConversations = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setConversationsLoading(true);
      }
      
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5001/api/messages/conversations", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const conversationsList = data.conversations || [];
        
        const transformedConversations = conversationsList.map(conv => {
          if (!conv || !conv.user) return null;
          
          const conversationId = `conv_${conv.user._id}`;
          
          return {
            id: conversationId,
            participants: [conv.user, user],
            lastMessage: conv.lastMessage ? {
              content: conv.lastMessage.content,
              timestamp: conv.lastMessage.timestamp,
              sender: conv.lastMessage.isFromMe ? user : conv.user,
              messageId: conv.lastMessage._id || conv.lastMessage.id
            } : null,
            unreadCount: 0
          };
        }).filter(Boolean);
        
        // Create a stable comparison key for each conversation
        const getConversationKey = (conv) => 
          `${conv.id}-${conv.lastMessage?.messageId || 'empty'}-${conv.lastMessage?.timestamp || 0}`;
        
        const currentKeys = transformedConversations.map(getConversationKey).join('|');
        const previousKeys = prevConversationsRef.current.map(getConversationKey).join('|');
        
        // Only update if conversations actually changed
        if (currentKeys !== previousKeys) {
          // Detect new conversations
          const prevConversationIds = new Set(prevConversationsRef.current.map(c => c.id));
          const newIds = new Set(
            transformedConversations
              .filter(conv => !prevConversationIds.has(conv.id))
              .map(conv => conv.id)
          );
          
          // Detect conversations with new messages
          const newUnreadConversations = new Set(unreadConversations);
          transformedConversations.forEach(conv => {
            if (conv.lastMessage) {
              const lastSeenMessageId = lastSeenMessages.current.get(conv.id);
              const currentMessageId = conv.lastMessage.messageId;
              
              if (conv.lastMessage.sender?.eclipseId !== user?.eclipseId && 
                  (!lastSeenMessageId || lastSeenMessageId !== currentMessageId)) {
                newUnreadConversations.add(conv.id);
              }
            }
          });

          // Update refs and state
          prevConversationsRef.current = transformedConversations;
          setConversations(transformedConversations);
          
          if (newIds.size > 0) {
            setNewConversationIds(newIds);
            setTimeout(() => setNewConversationIds(new Set()), 300);
          }
          
          if (newUnreadConversations.size !== unreadConversations.size || 
              ![...newUnreadConversations].every(id => unreadConversations.has(id))) {
            setUnreadConversations(newUnreadConversations);
          }
        }
      } else {
        console.error("Failed to fetch conversations, status:", response.status);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      if (showLoading) {
        setConversationsLoading(false);
      }
    }
  }, [user, unreadConversations]);
  useEffect(() => {
    if (!user) return;

    const conversationPolling = setInterval(() => {
      fetchConversations(false);
    }, 3000);

    return () => clearInterval(conversationPolling);
  }, [user]);

  useEffect(() => {
    window.openEditProfile = () => {
      setIsEditProfileOpen(true);
    };

    return () => {
      delete window.openEditProfile;
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
  };

  // Add function to handle connection requests modal
  const handleConnectionRequestsToggle = () => {
    setIsConnectionRequestsOpen(!isConnectionRequestsOpen);
  };

  const handleCloseConnectionRequests = () => {
    setIsConnectionRequestsOpen(false);
    // Refresh the pending requests count when modal is closed
    fetchPendingRequestsCount();
  };

  const handleUpdateProfile = async (updateData) => {
    try {
      const token = localStorage.getItem("token");
      let response = { success: true, message: "Profile updated successfully" };

      // Handle display name update
      if (updateData.displayName) {
        const res = await fetch("http://localhost:5001/api/users/update-displayName", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ displayName: updateData.displayName }),
        });

        const data = await res.json();
        if (res.ok) {
          setUser(data.user);
        } else {
          return { success: false, message: data.message };
        }
      }

      // Handle password update
      if (updateData.currentPassword && updateData.newPassword) {
        const res = await fetch("http://localhost:5001/api/users/update-password", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            oldPassword: updateData.currentPassword,
            newPassword: updateData.newPassword
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          return { success: false, message: data.message };
        }
      }

      if (updateData.avatarSettings) {
        const { character, font, backgroundColor, foregroundColor, useGradient, gradientColor } = updateData.avatarSettings;
        const cleanBg = backgroundColor?.replace('#', '') || '3B82F6';
        const cleanFg = foregroundColor?.replace('#', '') || 'FFFFFF';
        const cleanGradient = gradientColor?.replace('#', '') || '9333EA';

        const bgParam = useGradient ? `${cleanBg},${cleanGradient}` : cleanBg;
        const displayChar = character || 'EC';
        const fontName = font || 'Montserrat';

        const avatarUrl = `https://placehold.co/120x120/${bgParam}/${cleanFg}?text=${encodeURIComponent(displayChar)}&font=${encodeURIComponent(fontName)}`;
        console.log(avatarUrl)

        const res = await fetch("http://localhost:5001/api/users/update-profilePic", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ avatar: avatarUrl }),
        });
        const data = await res.json();
        if (res.ok) {
          setUser(data.user);
        } else {
          return { success: false, message: data.message };
        }
      }

      return response;
    } catch (error) {
      console.error("Update profile error:", error);
      return { success: false, message: "Network error. Please try again." };
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async (password) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5001/api/users/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.removeItem("token");
        navigate("/login");
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error("Delete account error:", error);
      return { success: false, message: "Network error. Please try again." };
    }
  };

  const handleUserSelect = (selectedUser) => {
    console.log('Selected user:', selectedUser);
    setSelectedUser(selectedUser);
    setShowSearch(false);
    // Refresh conversations when a new chat is started
    fetchConversations(false);
  };

  const handleConversationSelect = useCallback((conversation) => {
    // Find the other user from the transformed conversation structure
    const otherUser = conversation.participants.find(
      participant => participant && participant.eclipseId !== user?.eclipseId
    );
    
    if (!otherUser) {
      console.error('Could not find other user in conversation for selection');
      return;
    }
    
    // Mark this conversation as read
    if (conversation.lastMessage) {
      lastSeenMessages.current.set(conversation.id, conversation.lastMessage.messageId);
      // Remove from unread conversations
      setUnreadConversations(prev => {
        const updated = new Set(prev);
        updated.delete(conversation.id);
        return updated;
      });
    }
    
    setSelectedUser(otherUser);
  }, [user]);

  const handleBackToChats = () => {
    setSelectedUser(null);
    // Refresh conversations when returning to chat list
    fetchConversations(false);
  };

  // Function to mark conversation as read when user sends a message
  const handleMessageSent = (recipientUser) => {
    // Find the conversation with this user
    const conversation = conversations.find(conv => {
      const otherUser = conv.participants.find(p => p?.eclipseId !== user?.eclipseId);
      return otherUser?.eclipseId === recipientUser?.eclipseId;
    });
    
    if (conversation && conversation.lastMessage) {
      lastSeenMessages.current.set(conversation.id, conversation.lastMessage.messageId);
      setUnreadConversations(prev => {
        const updated = new Set(prev);
        updated.delete(conversation.id);
        return updated;
      });
    }
    
    // Refresh conversations
    fetchConversations(false);
  };

  const formatMessagePreview = useCallback((content) => {
    return content.length > 50 ? content.substring(0, 50) + '...' : content;
  }, []);

  const formatLastMessageTime = useCallback((timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now - date) / (1000 * 60);
    const diffInHours = diffInMinutes / 60;
    const diffInDays = diffInHours / 24;
    
    if (diffInMinutes < 1) {
      return 'now';
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }, []);

  // Memoized conversation items to prevent unnecessary re-renders
  const conversationItems = useMemo(() => {
    return conversations.map((conversation) => {
      const otherUser = conversation.participants.find(
        participant => participant && participant.eclipseId !== user?.eclipseId
      );
      
      const isNewConversation = newConversationIds.has(conversation.id);
      const hasUnreadMessages = unreadConversations.has(conversation.id);
      
      return {
        ...conversation,
        otherUser,
        isNewConversation,
        hasUnreadMessages,
        isSelected: selectedUser?.eclipseId === otherUser?.eclipseId
      };
    });
  }, [conversations, newConversationIds, unreadConversations, selectedUser?.eclipseId, user?.eclipseId]);

  const ConversationCard = useCallback(({ conversation }) => {
    const { otherUser, isNewConversation, hasUnreadMessages, isSelected } = conversation;
    
    return (
      <div 
        className={`conversation-card ${isSelected ? 'selected' : ''} ${isNewConversation ? 'new-conversation' : ''} ${hasUnreadMessages ? 'has-unread' : ''}`}
        onClick={() => handleConversationSelect(conversation)}
      >
        <div className={`conversation-avatar ${hasUnreadMessages ? 'has-unread' : ''}`}>
          <img 
            src={otherUser.avatar || '/default-avatar.png'} 
            alt={otherUser.displayName || 'User'} 
            onError={(e) => {
              e.target.src = '/default-avatar.png';
            }}
          />
        </div>
        <div className="conversation-details">
          <div className="conversation-header">
            <h4 className="conversation-name">{otherUser.displayName || 'Unknown User'}</h4>
            <span className="conversation-time">
              {conversation.lastMessage?.timestamp 
                ? formatLastMessageTime(conversation.lastMessage.timestamp)
                : ''
              }
            </span>
          </div>
          <div className="conversation-preview">
            <p className="last-message">
              {conversation.lastMessage?.content
                ? (conversation.lastMessage.sender?.eclipseId === user?.eclipseId 
                    ? `You: ${formatMessagePreview(conversation.lastMessage.content)}`
                    : formatMessagePreview(conversation.lastMessage.content)
                  )
                : 'No messages yet'
              }
            </p>
            {hasUnreadMessages && (
              <span className="unread-badge">
                •
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }, [user?.eclipseId, handleConversationSelect, formatMessagePreview, formatLastMessageTime]);

  if (loading) {
    return (
      <div className="chats-container2">
        <div className="stars">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="star"></div>
          ))}
        </div>
        <div className="appBrand">
          <img src={applogo} alt="Eclipse Logo" />
          <h2>Eclipse Chat</h2>
        </div>
        <div className="loading-section">
          <p className="loading-text">Contacting Mission Control...</p>
          <p className="loading-text2">Receiving your coordinates...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="chats-container">
        <div className="innerContainers contactsArea">
          {/* Hero Section */}
          <div className="heroSection">
            <div className="appBrand">
              <img src={applogo} alt="Eclipse Logo" />
              <h2>Eclipse Chat</h2>
            </div>
            <div className="userAvatar" onClick={handleMenuToggle}>
              <img src={user?.avatar} alt="User Avatar" />
            </div>
          </div>
          {/* Chats + Search */}
          <div className="chats">
            <div className="searchArea">
              <div className="search-header">
                <h3>Chats</h3>
                <div className="interactionButtons">
                  <div className="connection-request-div" onClick={handleConnectionRequestsToggle}>
                    {pendingRequestsCount > 0 && (
                      <span className="notification-badge">
                        {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                      </span>
                    )}
                    <i className="ph ph-planet"></i>
                  </div>
                </div>
              </div>
              {
                <div className="user-search-section">
                  <UserSearch onUserSelect={handleUserSelect} />
                </div>
              }
            </div>
            
            {/* Conversations List */}
            <div className="contacts">
              {conversationsLoading ? (
                <div className="conversations-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading conversations...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="emptyState">
                  <img src={noContactsIllustration} alt="No Contacts Illustration" className="empty-illustration" />
                  <p className="empty-text">No one to orbit yet...</p>
                  <span className="empty-subtext">Start a new chat and grow your galaxy</span>
                </div>
              ) : (
                <div className="conversations-list">
                  {conversationItems.map((conversation) => (
                    <ConversationCard 
                      key={`stable-${conversation.id}-${conversation.lastMessage?.messageId || 'no-msg'}`}
                      conversation={conversation}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message Area */}
        <div className="messageArea">
          <MessageArea
            selectedUser={selectedUser}
            currentUser={user}
            onBack={handleBackToChats}
            onMessageSent={handleMessageSent} // Updated to handle unread state
          />
        </div>

      </div>

      {/* User Menu Modal */}
      <UserMenuModal
        isOpen={isMenuOpen}
        onClose={handleCloseMenu}
        user={user}
        onLogout={handleLogout}
        onDeleteAccount={handleDeleteAccount}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        user={user}
        onUpdateProfile={handleUpdateProfile}
      />

      {/* Connection Requests Modal */}
      <ConnectionRequestsModal
        isOpen={isConnectionRequestsOpen}
        onClose={handleCloseConnectionRequests}
      />
    </>
  );
};

export default Chats;