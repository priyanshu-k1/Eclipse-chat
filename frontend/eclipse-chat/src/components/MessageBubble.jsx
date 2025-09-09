import React, { useState } from 'react';
import './MessageBubble.css';

const MessageBubble = ({ 
  message, 
  isFromMe, 
  formatTime, 
  formatExpirationTime, 
  onSaveMessage,
  onCopyMessage,
  currentUser 
}) => {
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleSaveClick = async () => {
    setIsActionLoading(true);
    try {
      await onSaveMessage(message.id);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCopyClick = async () => {
    if (onCopyMessage) {
      await onCopyMessage(message.content);
    } else {
      // Fallback copy implementation
      try {
        await navigator.clipboard.writeText(message.content);
      } catch (err) {
        console.warn('Copy failed:', err);
      }
    }
  };

  const handleBubbleClick = () => {
    // Toggle actions on mobile
    setShowActions(!showActions);
  };

  // Determine save status
  const isSavedByMe = isFromMe ? message.isSavedBySender : message.isSavedByReceiver;
  const isSavedByOther = isFromMe ? message.isSavedByReceiver : message.isSavedBySender;
  const isSavedByBoth = message.isSavedBySender && message.isSavedByReceiver;

  // Get avatars
  const senderAvatar = message.sender?.avatar;
  const receiverAvatar = message.receiver?.avatar;
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
      onClick={handleBubbleClick}
    >
      <div className="message-content">
        <p className="message-text">{message.content}</p>
      </div>
      
      <div className="message-footer">
        <div className="message-info">
          <span className="message-time">
            {formatTime(message.timestamp)}
          </span>
          {message.expiresAt && !isSavedByBoth && (
            <div className="message-expires">
              <i className="ph ph-clock"></i>
              <span>Expires in {formatExpirationTime(message.expiresAt)}</span>
            </div>
          )}
          
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
              <span className={`ph ${isSavedByMe ? 'ph-trash' : 'ph-bookmark-simple'}`}></span>
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