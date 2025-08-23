// NotFound.jsx
import { Link } from 'react-router-dom';
import './NotFound.css';

function NotFound() {
  return (
    <div className="not-found-container">
      <div className="eclipse-bg">
        <div className="eclipse-circle"></div>
        <div className="eclipse-shadow"></div>
      </div>

      <div className="stars">
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
       </div>
      
      <div className="not-found-content">
        <div className="error-code">404</div>
        
        <h1 className="error-title">
          Page Lost in the <span className="highlight">Eclipse</span>
        </h1>
        
        <p className="error-message">
          This page has vanished without a trace – just like your messages should.
          <br />
          <span className="privacy-note">Your privacy matters, even when you're lost.</span>
        </p>
        
        <div className="error-actions">
          <Link to="/" className="btn-primary">
            <span class="btn-icon material-symbols-outlined">home</span>
            Return Home
          </Link>
          <Link to="/signup" className="btn-secondary">
            <span class="btn-icon material-symbols-outlined">lock</span>
            Get Started
          </Link>
        </div>
        
        <div className="privacy-reminder">
          <span className="btn-icon material-symbols-outlined">shield_locked</span>
          <span>Secure • Private • Ephemeral</span>
        </div>
      </div>
      
      {/* Floating particles for atmosphere */}
      <div className="particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
    </div>
  );
}

export default NotFound;