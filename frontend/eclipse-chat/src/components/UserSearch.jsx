import React, { useState, useRef, useEffect } from 'react';
import './UserSearch.css';
import ToastNotification from './ToastNotification';

const UserSearch = ({ onUserSelect }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [requestLoadingStates, setRequestLoadingStates] = useState({});
  const [userStates, setUserStates] = useState({});

  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'success'
  });

  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({
      isVisible: true,
      message,
      type
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const debouncedSearch = (searchTerm) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      if (searchTerm.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5001/api/users/search?q=${encodeURIComponent(searchTerm)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.users);
          setShowSuggestions(true);
          setSelectedIndex(-1);

          await checkUserRelationships(data.users);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
        showToast('Failed to search users. Please try again.', 'error');
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  const checkUserRelationships = async (users) => {
    try {
      const token = localStorage.getItem("token");
      const newUserStates = {};

      for (const user of users) {
        try {
          const res = await fetch(`http://localhost:5001/api/orbits/check-relationship/${user.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          });

          if (res.ok) {
            const data = await res.json();
            newUserStates[user.id] = data.status;
          } else {
            newUserStates[user.id] = 'none';
          }
        } catch (error) {
          console.error(`Error checking relationship for user ${user.id}:`, error);
          newUserStates[user.id] = 'none';
        }
      }

      setUserStates(prev => ({ ...prev, ...newUserStates }));
    } catch (error) {
      console.error('Error checking user relationships:', error);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleOpenChat(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleOpenChat = (user) => {
    console.log('Opening chat with:', user.displayName);
    setQuery(`${user.displayName} (@${user.eclipseId})`);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    if (onUserSelect) {
      onUserSelect(user);
    }
    // Placeholder for chat opening functionality
    showToast(`Opening chat with ${user.displayName}`, 'info');
  };

  const handleConnectionRequest = async (user, e) => {
    e.stopPropagation();
    console.log('Connection request initiated for:', user.displayName);

    const currentState = userStates[user.id];
    if (currentState === 'friends' || currentState === 'pending_sent' || requestLoadingStates[user.id]) {
      console.log('Request blocked - current state:', currentState);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      showToast('Authentication token not found. Please log in again.', 'error');
      return;
    }

    setRequestLoadingStates(prev => ({ ...prev, [user.id]: true }));
    console.log('Loading state set for:', user.id);

    try {
      const requestBody = { receiverId: user.id };
      const res = await fetch("http://localhost:5001/api/orbits/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      console.log('Server response:', { status: res.status, data });

      if (res.ok) {
        setUserStates(prev => ({ ...prev, [user.id]: 'pending_sent' }));
        showToast(`Connection request sent to ${user.displayName}!`, 'success');
        console.log('Request sent successfully');
      } else {
        showToast(data.message || 'Failed to send connection request. Please try again.', 'error');
        console.log('Request failed:', data.message);
      }
    } catch (error) {
      console.error('Network error:', error);
      showToast('Network error. Please check your connection and try again.', 'error');
    } finally {
      setRequestLoadingStates(prev => ({ ...prev, [user.id]: false }));
      console.log('Loading state cleared for:', user.id);
    }
  };

  const getActionButton = (user) => {
    const state = userStates[user.id];
    const isLoading = requestLoadingStates[user.id];

    if (isLoading) {
      return (
        <div className="action-spinner"></div>
      );
    }

    switch (state) {
      case 'friends':
        return <i className="ph ph-handshake"></i>;
      case 'pending_sent':
        return <i className="ph ph-clock"></i>;
      case 'pending_received':
        return <i className="ph ph-user-check"></i>;
      default:
        return <i className="ph ph-user-plus"></i>;
    }
  };

  const getActionTooltip = (user) => {
    const state = userStates[user.id];

    switch (state) {
      case 'friends':
        return 'Already connected';
      case 'pending_sent':
        return 'Request sent';
      case 'pending_received':
        return 'Pending request from this user';
      default:
        return 'Send connection request';
    }
  };

  const getActionClassName = (user) => {
    const state = userStates[user.id];
    const isLoading = requestLoadingStates[user.id];

    let className = 'suggestion-action';

    if (isLoading) {
      className += ' loading';
    } else {
      switch (state) {
        case 'friends':
          className += ' friends';
          break;
        case 'pending_sent':
          className += ' pending-sent';
          break;
        case 'pending_received':
          className += ' pending-received';
          break;
        default:
          className += ' add-friend';
          break;
      }
    }
    
    return className;
  };

  const handleClickOutside = (event) => {
    if (searchRef.current && !searchRef.current.contains(event.target)) {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setUserStates({});
    setRequestLoadingStates({});
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <>
      <div className="user-search-container" ref={searchRef}>
        <div className="search-input-container">
          <div className="search-icon">
            <i className="ph ph-magnifying-glass"></i>
          </div>
          <input
            type="text"
            className="search-input"
            placeholder="Search users by Eclipse ID..."
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
          />
          {query && (
            <button className="clear-search" onClick={handleClearSearch}>
              <i className="ph ph-x"></i>
            </button>
          )}
          {isLoading && (
            <div className="search-loading">
              <div className="loading-spinner"></div>
            </div>
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="suggestions-dropdown" ref={suggestionsRef}>
            {suggestions.map((user, index) => (
              <div
                key={user.id}
                className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => handleOpenChat(user)}
              >
                <div className="suggestion-avatar">
                  <img src={user.avatar} alt={`${user.displayName} avatar`} />
                </div>
                
                <div className="suggestion-content">
                  <div className="suggestion-name">{user.displayName}</div>
                  <div className="suggestion-id">@{user.eclipseId}</div>
                  <div className="suggestion-username">{user.username}</div>
                </div>
                
                <div className="suggestion-action-wrapper">
                  <button
                    className={getActionClassName(user)}
                    title={getActionTooltip(user)}
                    onClick={(e) => handleConnectionRequest(user, e)}
                    disabled={requestLoadingStates[user.id] || userStates[user.id] === 'friends' || userStates[user.id] === 'pending_sent'}
                    type="button"
                  >
                    {getActionButton(user)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showSuggestions && suggestions.length === 0 && query.length >= 2 && !isLoading && (
          <div className="suggestions-dropdown">
            <div className="no-results">
              <i className="ph ph-magnifying-glass"></i>
              <p>No users found for "{query}"</p>
            </div>
          </div>
        )}
      </div>

      <ToastNotification
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </>
  );
};

export default UserSearch;