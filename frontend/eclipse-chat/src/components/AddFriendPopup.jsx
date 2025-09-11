import React, { useState, useEffect } from 'react';
import './AddFriendPopup.css';

const AddFriendPopup = ({ 
  onAccept, 
  onClose, 
  isVisible = true, 
  username = "User",
  customMessage 
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setIsClosing(false);
    } else {
      setIsClosing(true);
      // Remove from DOM after animation completes
      setTimeout(() => {
        setShouldRender(false);
      }, 400);
    }
  }, [isVisible]);

  const handleAccept = () => {
    setIsClosing(true);
    setTimeout(() => {
      onAccept?.();
    }, 400);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose?.();
    }, 400);
  };

  const friendshipMessages = [
    "Ready to eclipse the distance between us?",
    "Your friendship constellation awaits...",
    "Let's align our cosmic friendship orbits",
    "Time to illuminate this friendship eclipse",
    "Shall we bring light to this shadow of friendship?",
    "Ready to break through the friendship eclipse?",
    "Let's create a stellar friendship bond",
    "Your friendship is on the event horizon..."
  ];

  const getRandomMessage = () => {
    return customMessage || friendshipMessages[Math.floor(Math.random() * friendshipMessages.length)];
  };

  if (!shouldRender) return null;

  return (
    <div className={`addFriendPopUp ${isClosing ? 'closing' : 'opening'}`}>
      <div className="eclipse-glow"></div>
      <div className="stellar-particles">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
      </div>
      
      <p className="friendshipStatusText">{getRandomMessage()}</p>
      
      <div className="buttonHolder">
        <button 
          className="addFriendPopUpButton acceptButton"
          onClick={handleAccept}
          title={`Add ${username} as friend`}
        >
          <i className="ph ph-user-plus"></i>
          <div className="button-ripple"></div>
        </button>
        
        <button 
          className="addFriendPopUpButton closeButton"
          onClick={handleClose}
          title="Close"
        >
          <i className="ph ph-x"></i>
          <div className="button-ripple"></div>
        </button>
      </div>
    </div>
  );
};

export default AddFriendPopup;