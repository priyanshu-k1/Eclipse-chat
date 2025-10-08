import React, { useState, useEffect } from 'react';
import './MessageBubble.css';

const MessageBubble = ({ 
  message, 
  isFromMe, 
  formatTime, 
  onSaveMessage,
  onCopyMessage,
  currentUser,
}) => {
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [localMessage, setLocalMessage] = useState(message);
  const [countdown, setCountdown] = useState('');
  
  useEffect(() => {
    setLocalMessage(message);
  }, [message]);
  useEffect(() => {
    const isSavedByBoth = localMessage.isSavedBySender && localMessage.isSavedByReceiver;
    
    if (!localMessage.isSeen || !localMessage.expiresAt || isSavedByBoth) {
      setCountdown('');
      return;
    }

    const updateCountdown = () => {
      const expirationTime = new Date(localMessage.expiresAt);
      const currentTime = new Date();
      const timeLeft = expirationTime.getTime() - currentTime.getTime();

      if (timeLeft <= 0) {
        setCountdown('Expired');
        return;
      }

      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setCountdown(`${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${seconds}s`);
      }
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [localMessage.isSeen, localMessage.expiresAt, localMessage.isSavedBySender, localMessage.isSavedByReceiver]);

  const handleSaveClick = async () => {
    setIsActionLoading(true);
    try {
      await onSaveMessage(localMessage.id);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCopyClick = async () => {
    if (onCopyMessage) {
      await onCopyMessage(localMessage.content);
    } else {
      try {
        await navigator.clipboard.writeText(localMessage.content);
      } catch (err) {
        console.warn('Copy failed:', err);
      }
    }
  };

  const handleBubbleClick = () => {
    setShowActions(!showActions);
  };

  // Determine save status using localMessage
  const isSavedByMe = isFromMe ? localMessage.isSavedBySender : localMessage.isSavedByReceiver;
  const isSavedByOther = isFromMe ? localMessage.isSavedByReceiver : localMessage.isSavedBySender;
  const isSavedByBoth = localMessage.isSavedBySender && localMessage.isSavedByReceiver;

  // Get avatars
  const senderAvatar = localMessage.sender?.avatar;
  const receiverAvatar = localMessage.receiver?.avatar;
  const myAvatar = currentUser?.avatar || (isFromMe ? senderAvatar : receiverAvatar);
  const otherAvatar = isFromMe ? receiverAvatar : senderAvatar;

  const renderSaveStatus = () => {
    if (isSavedByBoth) {
      return (
        <div className="saved-indicator saved-both">
          <span className="saved-text">Saved</span>
          <div className="saved-avatars">
            <img src={senderAvatar} alt="Sender" className="mini-avatar" />
            <img src={receiverAvatar} alt="Receiver" className="mini-avatar" />
          </div>
        </div>
      );
    } else if (isSavedByMe) {
      return (
        <div className="saved-indicator saved-me">
          <span className="saved-text">Saved</span>
          <img src={myAvatar} alt="Me" className="mini-avatar" />
        </div>
      );
    } else if (isSavedByOther) {
      return (
        <div className="saved-indicator saved-other">
          <span className="saved-text">Saved</span>
          <img src={otherAvatar} alt="Other" className="mini-avatar" />
        </div>
      );
    }
    return null;
  };

  return (
    <div  
      className={`message-bubble ${isFromMe ? 'from-me' : 'from-them'} ${showActions ? 'active' : ''}`}
      data-message-id={localMessage.id}
      onClick={handleBubbleClick}>
      <div className="message-content">
        <p className="message-text">{localMessage.content}</p>
        {isFromMe && (
          <div className="message-seen-indicator">
            {localMessage.isSeen ? (
              <>
                <i className='ph ph-checks'></i>
                <span>Seen</span>
              </>
            ) : (
              <i className='ph ph-check'></i>
            )}  
          </div>
        )}
      </div>
      <div className="message-footer">
        <div className="message-info">
          <span className="message-time">
            {formatTime(localMessage.timestamp)}
          </span>
          
          {/* Show countdown only when message is seen and not saved by both */}
          {localMessage.isSeen && localMessage.expiresAt && !isSavedByBoth && countdown && (
            <div className="message-expires countdown-active">
              <i className="ph ph-clock"></i>
              <span className="countdown-text">{countdown}</span>
            </div>
          )}
          
          {/* Show static expiration info when not seen yet */}
          {/* {!localMessage.isSeen && localMessage.expiresAt && !isSavedByBoth && (
            <div className="message-expires">
              <i className="ph ph-eye-slash"></i>
              <span>Expires after seen</span>
            </div>
          )} */}
          
          {/* Save status indicators */}
          <div className="save-status">
            {renderSaveStatus()}
          </div>
        </div>
        
        {/* Message Actions */}
        <div className="message-actions">
          <button 
            className={`action-button save-button ${isSavedByMe ? 'saved' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleSaveClick();
            }}
            disabled={isActionLoading}
            title={isSavedByMe ? "Unsave message" : "Save message"}
          >
            {isActionLoading ? (
              <div className="action-spinner" />
            ) : (
              <span className="material-symbols-outlined">{isSavedByMe ?("bookmark_remove"):("bookmark")}</span>
            )}
          </button>
          
          <button 
            className="action-button copy-button"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyClick();
            }}
            title="Copy message"
          >
            <i className="ph ph-copy"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;