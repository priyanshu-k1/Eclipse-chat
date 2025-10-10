import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './MessageBubble.css';

const MessageBubble = ({ message, isFromMe, formatTime, onSaveMessage, onCopyMessage, currentUser }) => {
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [localMessage, setLocalMessage] = useState(message);
  const [countdown, setCountdown] = useState('');
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  
  useEffect(() => {
    setLocalMessage(message);
  }, [message]);

  // Prevent body scroll when image viewer is open
  useEffect(() => {
    if (imageViewerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [imageViewerOpen]);

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

    updateCountdown();
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
    if (localMessage.messageType !== 'file') {
      setShowActions(!showActions);
    }
  };

  const handleImageClick = (e) => {
    e.stopPropagation();
    setImageViewerOpen(true);
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    console.log('Download file:', localMessage.fileMetadata);
  };

  const isSavedByMe = isFromMe ? localMessage.isSavedBySender : localMessage.isSavedByReceiver;
  const isSavedByOther = isFromMe ? localMessage.isSavedByReceiver : localMessage.isSavedBySender;
  const isSavedByBoth = localMessage.isSavedBySender && localMessage.isSavedByReceiver;

  const senderAvatar = localMessage.sender?.avatar;
  const receiverAvatar = localMessage.receiver?.avatar;
  const myAvatar = currentUser?.avatar || (isFromMe ? senderAvatar : receiverAvatar);
  const otherAvatar = isFromMe ? receiverAvatar : senderAvatar;

  const isImage = localMessage.messageType === 'file' && 
    localMessage.fileMetadata?.fileType?.startsWith('image/');

  const isMediaFile = localMessage.messageType === 'file';

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

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return 'image';
    if (fileType?.startsWith('video/')) return 'videocam';
    if (fileType?.startsWith('audio/')) return 'audiotrack';
    if (fileType?.startsWith('application/pdf')) return 'picture_as_pdf';
    if (fileType?.includes('word') || fileType?.includes('document')) return 'description';
    if (fileType?.includes('sheet') || fileType?.includes('excel')) return 'table_chart';
    if (fileType?.includes('presentation') || fileType?.includes('powerpoint')) return 'slideshow';
    if (fileType?.includes('zip') || fileType?.includes('rar') || fileType?.includes('7z')) return 'folder_zip';
    return 'insert_drive_file';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <>
      <div  
        className={`message-bubble ${isFromMe ? 'from-me' : 'from-them'} ${showActions ? 'active' : ''} ${localMessage.messageType === 'file' ? 'file-message' : ''}`}
        data-message-id={localMessage.id}
        onClick={handleBubbleClick}>
        <div className="message-content">
          {localMessage.messageType === 'file' ? (
            <div className="file-message-wrapper">
              {isImage ? (
                <div className="image-preview-container" onClick={handleImageClick}>
                   <img 
                     src={localMessage.fileMetadata.fileUrl} 
                     alt={localMessage.fileMetadata.fileName}
                     className="message-image-preview"
                     loading="lazy"
                   />
                    <div className="image-overlay">
                      <span className="material-symbols-outlined">zoom_in</span>
                    </div>  
                </div>
              ):(
                <div className="file-attachment">
                  <div className="file-icon-wrapper">
                    <span className="material-symbols-outlined file-type-icon">
                      {getFileIcon(localMessage.fileMetadata.fileType)}
                    </span>
                  </div>
                  <div className="file-info">
                    <div className="file-name-attachment">{localMessage.fileMetadata.fileName}</div>
                    <div className="file-size-attachment">
                      {formatFileSize(localMessage.fileMetadata.fileSize)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="message-text">{localMessage.content}</p>
          )}
          
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
            
            {localMessage.isSeen && localMessage.expiresAt && !isSavedByBoth && countdown && (
              <div className="message-expires countdown-active">
                <i className="ph ph-clock"></i>
                <span className="countdown-text">{countdown}</span>
              </div>
            )}
            
            {!isMediaFile && (
              <div className="save-status">
                {renderSaveStatus()}
              </div>
            )}
          </div>
          
          <div className="message-actions">
            {isMediaFile ? (
              <button 
                className="action-button download-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(e);
                }}
                title="Download file"
              >
                <span className="material-symbols-outlined">download</span>
              </button>
            ) : (
              <>
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
                    <span className="material-symbols-outlined">
                      {isSavedByMe ? "bookmark_remove" : "bookmark"}
                    </span>
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Image Viewer Modal - Only render when open */}
      {imageViewerOpen && isImage && ReactDOM.createPortal(
        <div className="image-viewer-overlay" onClick={() => setImageViewerOpen(false)}>
           <button className="image-viewer-close"
              onClick={(e) => {
                e.stopPropagation();
                setImageViewerOpen(false);
              }}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          <div className="image-viewer-container">
            <img 
              src={localMessage.fileMetadata.fileUrl}
              alt={localMessage.fileMetadata.fileName}
              className="image-viewer-image"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="image-viewer-info">
              <span>{localMessage.fileMetadata.fileName}</span>
              <button 
                className="image-viewer-download"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(e);
                }}
              >
                <span className="material-symbols-outlined">download</span>
                Download
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default MessageBubble;