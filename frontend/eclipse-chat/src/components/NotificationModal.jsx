import React, { useEffect } from 'react'
import './NotificationModal.css'
import applogo from '../assets/Eclipse-Logo.png';

// Props: isOpen, onClose, title, message, type = 'info', imageSrc, showImage
const NotificationModal = ({ 
    isOpen = true, 
    onClose = () => {}, 
    title = "Notification", 
    message = "This is a notification message", 
    type = 'info',
    imageSrc = null,
    showImage = false 
}) => {

    useEffect(() => {
        const handleKeyPress = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyPress);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, [isOpen, onClose]);
    if (!isOpen) return null;
    return (
        <div className={`eclipseModal ${type}`}>
            <div className="modalTitle">
                <div className="logo">
                    <img src={applogo} alt="Eclipse Logo" />
                </div>
                <div className="title">
                    <p>{title}</p>
                </div>
                <div className="close" onClick={onClose}>
                    <i className="ph ph-x"></i>
                </div>
            </div>
            <div className="modalBody">
                <div className="bodyContent">
                    {showImage && imageSrc && (
                        <div className="modalImage">
                            <img src={imageSrc} alt="Notification" />
                        </div>
                    )}
                    <div className="messageContainer">
                        <p className="message">{message}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default NotificationModal