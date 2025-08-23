import React, { useEffect } from 'react';

function Modal({ isOpen, onClose, title, message, type = 'info' }) {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const colors = {
    primary: '#0B0C10',
    secondary: '#1F1F2E',
    accent: '#6C63FF',
    highlight: '#db6439ff',
    cyan: '#00C2FF',
    textPrimary: '#FFFFFF',
    textSecondary: '#B0B0B0'
  };

  // Theme-based styles for different modal types
  const getThemeStyles = () => {
    switch (type) {
      case 'success':
        return {
          borderColor: colors.cyan,
          titleColor: colors.cyan,
          iconColor: colors.cyan,
          glowColor: '0 0 20px rgba(0, 194, 255, 0.3)'
        };
      case 'error':
        return {
          borderColor: colors.highlight,
          titleColor: colors.highlight,
          iconColor: colors.highlight,
          glowColor: '0 0 20px rgba(255, 107, 53, 0.3)'
        };
      case 'info':
      default:
        return {
          borderColor: colors.accent,
          titleColor: colors.accent,
          iconColor: colors.accent,
          glowColor: '0 0 20px rgba(108, 99, 255, 0.3)'
        };
    }
  };

  const theme = getThemeStyles();

  // Icon based on type
  const getIcon = () => {
    const iconStyle = {
      width: '24px',
      height: '24px',
      fill: 'none',
      stroke: theme.iconColor,
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round'
    };

    switch (type) {
      case 'success':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5"></path>
          </svg>
        );
      case 'error':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        );
      case 'info':
      default:
        return (
          <svg style={iconStyle} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 16v-4"></path>
            <path d="M12 8h.01"></path>
          </svg>
        );
    }
  };

  const modalStyles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(11, 12, 16, 0.15)', 
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px',
      animation: isOpen ? 'fadeIn 0.3s ease-out' : 'fadeOut 0.3s ease-in'
    },
    modal: {
      backgroundColor: colors.secondary, 
      borderRadius: '16px',
      boxShadow: `${theme.glowColor}, 0 25px 50px -12px rgba(0, 0, 0, 0.5)`,
      padding: '24px',
      maxWidth: '420px',
      width: '100%',
      maxHeight: '90vh',
      overflow: 'auto',
      position: 'relative',
      border: `2px solid ${theme.borderColor}`,
      animation: isOpen ? 'slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'slideOut 0.3s ease-in'
    },
    header: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '16px',
      marginBottom: '20px'
    },
    iconContainer: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      backgroundColor: 'rgba(255, 255, 255, 0.05)', 
      border: `1px solid ${theme.borderColor}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      boxShadow: `inset 0 0 20px rgba(${theme.iconColor === colors.cyan ? '0, 194, 255' : theme.iconColor === colors.highlight ? '255, 107, 53' : '108, 99, 255'}, 0.1)`
    },
    content: {
      flex: 1
    },
    title: {
      fontSize: '20px',
      fontWeight: '600',
      color: theme.titleColor,
      margin: '0 0 8px 0',
      lineHeight: '1.4',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      textShadow: `0 0 10px ${theme.titleColor}40`
    },
    message: {
      fontSize: '15px',
      color: colors.textSecondary, 
      lineHeight: '1.6',
      margin: 0,
      fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      textAlign: 'center'
    },
    buttonContainer: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      marginTop: '24px'
    },
    button: {
      background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.cyan} 100%)`,
      color: colors.textPrimary,
      border: 'none',
      borderRadius: '12px',
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      outline: 'none',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxShadow: '0 4px 15px rgba(108, 99, 255, 0.3)',
      position: 'relative',
      overflow: 'hidden'
    },
    closeIcon: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: colors.textSecondary,
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '8px',
      transition: 'all 0.3s ease',
      width: '36px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  };

  return (
    <>
      <div style={modalStyles.overlay} onClick={handleBackdropClick}>
        <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
          <button style={modalStyles.closeIcon} onClick={onClose}onMouseOver={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.color = colors.textPrimary;
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              e.target.style.color = colors.textSecondary;
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
            aria-label="Close modal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          <div style={modalStyles.header}>
            <div style={modalStyles.content}>
              <h2 style={modalStyles.title}>
                {title}
              </h2>
              <p style={modalStyles.message}>
                {message}
              </p>
            </div>
          </div>
          
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '24px',
            padding: '20px 0'
          }}>
            {type === 'error' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${colors.highlight}20 0%, ${colors.highlight}10 100%)`,
                  border: `2px solid ${colors.highlight}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'pulseError 2s infinite'
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={colors.highlight} strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '4px'
                }}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: colors.highlight,
                      animation: `dotPulse 1.4s ${i * 0.2}s infinite ease-in-out`
                    }}></div>
                  ))}
                </div>
              </div>
            )}
            
            {type === 'success' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${colors.cyan}20 0%, ${colors.cyan}10 100%)`,
                  border: `2px solid ${colors.cyan}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'pulseSuccess 2s infinite'
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={colors.cyan} strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  <div style={{
                    width: '20px',
                    height: '2px',
                    backgroundColor: colors.cyan,
                    borderRadius: '1px',
                    animation: 'slideRight 1s ease-out'
                  }}></div>
                  <div style={{
                    fontSize: '12px',
                    color: colors.cyan,
                    fontWeight: '500',
                    animation: 'fadeInUp 1s 0.5s both'
                  }}>
                    Secure & Encrypted
                  </div>
                  <div style={{
                    width: '20px',
                    height: '2px',
                    backgroundColor: colors.cyan,
                    borderRadius: '1px',
                    animation: 'slideLeft 1s ease-out'
                  }}></div>
                </div>
              </div>
            )}
            
            {type === 'info' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${colors.accent}20 0%, ${colors.accent}10 100%)`,
                  border: `2px solid ${colors.accent}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  animation: 'rotateGlow 3s linear infinite'
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4"/>
                    <path d="M12 8h.01"/>
                  </svg>
                  <div style={{
                    position: 'absolute',
                    width: '100px',
                    height: '100px',
                    border: `1px solid ${colors.accent}20`,
                    borderRadius: '50%',
                    animation: 'spin 8s linear infinite'
                  }}></div>
                  <div style={{
                    position: 'absolute',
                    width: '120px',
                    height: '120px',
                    border: `1px solid ${colors.accent}15`,
                    borderRadius: '50%',
                    animation: 'spin 12s linear infinite reverse'
                  }}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { 
            opacity: 0; 
          }
          to { 
            opacity: 1; 
          }
        }
        
        @keyframes fadeOut {
          from { 
            opacity: 1; 
          }
          to { 
            opacity: 0; 
          }
        }
        
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: scale(0.85) translateY(-20px);
          }
          to { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes slideOut {
          from { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to { 
            opacity: 0;
            transform: scale(0.85) translateY(-20px);
          }
        }

        /* Button ripple effect */
        @keyframes ripple {
          from {
            opacity: 1;
            transform: scale(0);
          }
          to {
            opacity: 0;
            transform: scale(4);
          }
        }

        /* Eclipse Chat themed animations */
        @keyframes pulseError {
          0%, 100% { 
            box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.4);
          }
          50% { 
            box-shadow: 0 0 0 20px rgba(255, 107, 53, 0);
          }
        }

        @keyframes pulseSuccess {
          0%, 100% { 
            box-shadow: 0 0 0 0 rgba(0, 194, 255, 0.4);
          }
          50% { 
            box-shadow: 0 0 0 20px rgba(0, 194, 255, 0);
          }
        }

        @keyframes rotateGlow {
          0% { 
            box-shadow: 0 0 20px rgba(108, 99, 255, 0.3);
          }
          50% { 
            box-shadow: 0 0 30px rgba(108, 99, 255, 0.5);
          }
          100% { 
            box-shadow: 0 0 20px rgba(108, 99, 255, 0.3);
          }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes dotPulse {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes slideRight {
          from {
            width: 0;
            opacity: 0;
          }
          to {
            width: 20px;
            opacity: 1;
          }
        }

        @keyframes slideLeft {
          from {
            width: 0;
            opacity: 0;
          }
          to {
            width: 20px;
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

export default Modal;