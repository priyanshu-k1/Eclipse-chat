import React from 'react';
import './ParticlesBackground.css';

const ParticlesBackground = () => {
  // Generate particles data for animation
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    animationDelay: Math.random() * 4,
    animationDuration: Math.random() * 3 + 2,
    opacity: Math.random() * 0.6 + 0.2
  }));

  return (
    <div className="particles-container">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDelay: `${particle.animationDelay}s`,
            animationDuration: `${particle.animationDuration}s`,
            opacity: particle.opacity
          }}
        />
      ))}
      
      {/* Connection lines */}
      <div className="connections">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="connection-line"
            style={{
              left: `${Math.random() * 80 + 10}%`,
              top: `${Math.random() * 80 + 10}%`,
              width: `${Math.random() * 100 + 50}px`,
              transform: `rotate(${Math.random() * 360}deg)`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Floating orbs */}
      <div className="floating-orbs">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className={`orb orb-${i + 1}`}
            style={{
              left: `${Math.random() * 90 + 5}%`,
              top: `${Math.random() * 90 + 5}%`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Gradient overlay */}
      <div className="gradient-overlay" />
    </div>
  );
};

export default ParticlesBackground;