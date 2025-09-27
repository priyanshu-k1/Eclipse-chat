import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import './chats.css';
import applogo from '../assets/Eclipse-Logo.png';
import noContactsIllustration from '../assets/space-illustration.svg';
import UserMenuModal from './UserMenuModal';
import UserSearch from './UserSearch';
import ConnectionRequestsModal from './ConnectionRequestsModal';
import MessageArea from './MessageArea';
import NotificationModal from './NotificationModal'

const Chats = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConnectionRequestsOpen, setIsConnectionRequestsOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [setShowSearch] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);

  const [readStatusMap, setReadStatusMap] = useState(new Map());
  const prevConversationsRef = useRef([]);
  const [newConversationIds, setNewConversationIds] = useState(new Set());
  const [unreadConversations, setUnreadConversations] = useState(new Set());

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
        await fetchReadStatus();
        await fetchConversations(true);
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

  // Fetch read status from server
  const fetchReadStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5001/api/messages/read-status", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const statusMap = new Map();

        Object.entries(data.readStatus || {}).forEach(([conversationId, status]) => {
          statusMap.set(conversationId, status);
        });

        setReadStatusMap(statusMap);
      }
    } catch (error) {
      console.error("Error fetching read status:", error);
    }
  };

  const updateReadStatus = async (eclipseId, messageId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5001/api/messages/read-status", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eclipseId,
          messageId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setReadStatusMap(prev => {
          const updated = new Map(prev);
          updated.set(data.readStatus.conversationId, {
            lastSeenMessageId: data.readStatus.lastSeenMessageId,
            lastSeenAt: data.readStatus.lastSeenAt,
            conversationWith: data.readStatus.conversationWith
          });
          return updated;
        });
      }
    } catch (error) {
      console.error("Error updating read status:", error);
    }
  };

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
        
        const getConversationKey = (conv) =>
          `${conv.id}-${conv.lastMessage?.messageId || 'empty'}-${conv.lastMessage?.timestamp || 0}`;

        const currentKeys = transformedConversations.map(getConversationKey).join('|');
        const previousKeys = prevConversationsRef.current.map(getConversationKey).join('|');
        
        if (currentKeys !== previousKeys) {
          const prevConversationIds = new Set(prevConversationsRef.current.map(c => c.id));
          const newIds = new Set(
            transformedConversations
              .filter(conv => !prevConversationIds.has(conv.id))
              .map(conv => conv.id)
          );
          const newUnreadConversations = new Set();
          transformedConversations.forEach(conv => {
            if (conv.lastMessage) {
              if (conv.lastMessage.sender?.eclipseId !== user?.eclipseId) {
                const readStatus = readStatusMap.get(conv.id);
                const lastSeenMessageId = readStatus?.lastSeenMessageId;
                const currentMessageId = conv.lastMessage.messageId;
                if (!lastSeenMessageId || lastSeenMessageId !== currentMessageId) {
                  newUnreadConversations.add(conv.id);
                }
              }
            }
          });
          
          prevConversationsRef.current = transformedConversations;
          setConversations(transformedConversations);

          if (newIds.size > 0) {
            setNewConversationIds(newIds);
            setTimeout(() => setNewConversationIds(new Set()), 300);
          }
          setUnreadConversations(newUnreadConversations);
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
  }, [user, readStatusMap]);

  useEffect(() => {
    if (!user) return;

    const conversationPolling = setInterval(() => {
      fetchConversations(false);
      fetchReadStatus();
    }, 3000);

    return () => clearInterval(conversationPolling);
  }, [user, fetchConversations]);



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

  const handleConnectionRequestsToggle = () => {
    setIsConnectionRequestsOpen(!isConnectionRequestsOpen);
  };

  const handleCloseConnectionRequests = () => {
    setIsConnectionRequestsOpen(false);
    fetchPendingRequestsCount();
  };

 

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
    fetchConversations(false);
  };

  const handleConversationSelect = useCallback(async (conversation) => {
    const otherUser = conversation.participants.find(
      participant => participant && participant.eclipseId !== user?.eclipseId
    );

    if (!otherUser) {
      console.error('Could not find other user in conversation for selection');
      return;
    }
    if (conversation.lastMessage) {
      await updateReadStatus(otherUser.eclipseId, conversation.lastMessage.messageId);
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
    fetchConversations(false);
  };

  const handleMessageSent = async (recipientUser) => {
    await fetchConversations(false);
    setTimeout(async () => {
      const updatedConversation = conversations.find(conv => {
        const otherUser = conv.participants.find(p => p?.eclipseId !== user?.eclipseId);
        return otherUser?.eclipseId === recipientUser?.eclipseId;
      });

      if (updatedConversation && updatedConversation.lastMessage) {
        await updateReadStatus(recipientUser.eclipseId, updatedConversation.lastMessage.messageId);
        setUnreadConversations(prev => {
          const updated = new Set(prev);
          updated.delete(updatedConversation.id);
          return updated;
        });
      }
    }, 500);
  };

  const markAllAsRead = async () => {
    try {
      const unreadConvs = conversations.filter(conv => unreadConversations.has(conv.id));

      if (unreadConvs.length === 0) return;

      const updates = unreadConvs.map(conv => {
        const otherUser = conv.participants.find(p => p?.eclipseId !== user?.eclipseId);
        return {
          eclipseId: otherUser.eclipseId,
          messageId: conv.lastMessage.messageId
        };
      }).filter(update => update.eclipseId && update.messageId);

      if (updates.length > 0) {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5001/api/messages/read-status/batch", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ updates }),
        });

        if (response.ok) {
          const data = await response.json();
          setReadStatusMap(prev => {
            const updated = new Map(prev);
            Object.entries(data.readStatus || {}).forEach(([conversationId, status]) => {
              updated.set(conversationId, status);
            });
            return updated;
          });
          setUnreadConversations(new Set());
        }
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
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

  const conversationItems = useMemo(() => {
    return conversations.map((conversation) => {
      const otherUser = conversation.participants.find(
        participant => participant && participant.eclipseId !== user?.eclipseId
      );

      const isNewConversation = newConversationIds.has(conversation.id);
      let hasUnreadMessages = false;
      if (conversation.lastMessage && conversation.lastMessage.sender?.eclipseId !== user?.eclipseId) {
        const readStatus = readStatusMap.get(conversation.id);
        const lastSeenMessageId = readStatus?.lastSeenMessageId;
        const currentMessageId = conversation.lastMessage.messageId;

        hasUnreadMessages = !lastSeenMessageId || lastSeenMessageId !== currentMessageId;
      }

      return {
        ...conversation,
        otherUser,
        isNewConversation,
        hasUnreadMessages,
        isSelected: selectedUser?.eclipseId === otherUser?.eclipseId
      };
    });
  }, [conversations, newConversationIds, readStatusMap, selectedUser?.eclipseId, user?.eclipseId]);

  const totalUnreadCount = useMemo(() => {
    return conversationItems.filter(conv => conv.hasUnreadMessages).length;
  }, [conversationItems]);

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
          {hasUnreadMessages && (
            <div className="unread-indicator"></div>
          )}
        </div>
        <div className="conversation-details">
          <div className="conversation-header">
            <h4 className={`conversation-name ${hasUnreadMessages ? 'unread-name' : ''}`}>
              {otherUser.displayName || 'Unknown User'}
            </h4>
            <span className="conversation-time">
              {conversation.lastMessage?.timestamp
                ? formatLastMessageTime(conversation.lastMessage.timestamp)
                : ''
              }
            </span>
          </div>
          <div className="conversation-preview">
            {hasUnreadMessages ?
              <b><p className={`last-message ${hasUnreadMessages ? 'unread-message' : ''}`}>
                <i className="ph ph-chat-circle-dots"></i>
                {conversation.lastMessage?.content
                  ? (conversation.lastMessage.sender?.eclipseId === user?.eclipseId
                    ? `You: ${formatMessagePreview(conversation.lastMessage.content)}`
                    : formatMessagePreview(conversation.lastMessage.content)
                  )
                  : 'No messages yet'
                }
              </p></b>
              : <p className={`last-message ${hasUnreadMessages ? 'unread-message' : ''}`}>
                <i className="ph ph-chat-circle-dots"></i>
                {conversation.lastMessage?.content
                  ? (conversation.lastMessage.sender?.eclipseId === user?.eclipseId
                    ? `You: ${formatMessagePreview(conversation.lastMessage.content)}`
                    : formatMessagePreview(conversation.lastMessage.content)
                  )
                  : 'No messages yet'
                }
              </p>}
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
                <div className="chat-header-left">
                  <h3>Chats</h3>
                  {totalUnreadCount > 0 && (
                    <span className="total-unread-badge">
                      <i className="ph ph-broadcast"></i> Orbital Pings: {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                    </span>
                  )}
                </div>
                <div className="interactionButtons">
                  {totalUnreadCount > 0 && (
                    <button
                      className="mark-all-read-btn"
                      onClick={markAllAsRead}
                      title="Mark all as read"
                    >
                      <span className="material-symbols-outlined">mark_chat_read</span>
                    </button>
                  )}
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
              <div className="user-search-section">
                <UserSearch onUserSelect={handleUserSelect} />
              </div>
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
            onMessageSent={handleMessageSent}
            onMessageRead={(eclipseId, messageId) => updateReadStatus(eclipseId, messageId)}
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

      

      {/* Connection Requests Modal */}
      <ConnectionRequestsModal
        isOpen={isConnectionRequestsOpen}
        onClose={handleCloseConnectionRequests}
      />
    </>
  );
};

export default Chats;