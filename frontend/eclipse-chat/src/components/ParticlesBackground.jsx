import React, { useEffect, useRef } from 'react';

const ParticlesBackground = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Eclipse and star system
    const stars = [];
    const numStars = 150;
    const eclipseCenter = { x: canvas.width * 0.7, y: canvas.height * 0.3 };
    const eclipseRadius = 80;
    
    // Create stars
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        phase: Math.random() * Math.PI * 2,
        baseOpacity: Math.random() * 0.6 + 0.4
      });
    }

    // Create nebula particles
    const nebulaParticles = [];
    const numNebula = 80;
    
    for (let i = 0; i < numNebula; i++) {
      nebulaParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 40 + 10,
        opacity: Math.random() * 0.1 + 0.05,
        drift: Math.random() * 0.3 + 0.1,
        color: Math.random() > 0.5 ? 'rgba(75, 0, 130, ' : 'rgba(25, 25, 112, '
      });
    }

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Deep space gradient background
      const gradient = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.5, 0,
        canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.8
      );
      gradient.addColorStop(0, '#0a0a1a');
      gradient.addColorStop(0.5, '#050515');
      gradient.addColorStop(1, '#000000');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw nebula particles
      nebulaParticles.forEach(particle => {
        particle.x += Math.sin(time * 0.001) * particle.drift;
        particle.y += Math.cos(time * 0.0008) * particle.drift * 0.5;
        
        // Wrap around edges
        if (particle.x > canvas.width + 50) particle.x = -50;
        if (particle.x < -50) particle.x = canvas.width + 50;
        if (particle.y > canvas.height + 50) particle.y = -50;
        if (particle.y < -50) particle.y = canvas.height + 50;
        
        const nebulaGradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size
        );
        nebulaGradient.addColorStop(0, particle.color + particle.opacity + ')');
        nebulaGradient.addColorStop(1, particle.color + '0)');
        
        ctx.fillStyle = nebulaGradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw eclipse
      const eclipseOpacity = 0.3 + Math.sin(time * 0.002) * 0.1;
      
      // Eclipse shadow/corona effect
      const coronaGradient = ctx.createRadialGradient(
        eclipseCenter.x, eclipseCenter.y, eclipseRadius * 0.8,
        eclipseCenter.x, eclipseCenter.y, eclipseRadius * 2
      );
      coronaGradient.addColorStop(0, `rgba(255, 140, 0, ${eclipseOpacity * 0.8})`);
      coronaGradient.addColorStop(0.3, `rgba(255, 69, 0, ${eclipseOpacity * 0.4})`);
      coronaGradient.addColorStop(0.6, `rgba(255, 20, 147, ${eclipseOpacity * 0.2})`);
      coronaGradient.addColorStop(1, 'rgba(255, 20, 147, 0)');
      
      ctx.fillStyle = coronaGradient;
      ctx.beginPath();
      ctx.arc(eclipseCenter.x, eclipseCenter.y, eclipseRadius * 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Eclipse body (dark circle)
      ctx.fillStyle = `rgba(10, 10, 26, ${0.9 + Math.sin(time * 0.003) * 0.1})`;
      ctx.beginPath();
      ctx.arc(eclipseCenter.x, eclipseCenter.y, eclipseRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Eclipse rim light
      ctx.strokeStyle = `rgba(255, 215, 0, ${eclipseOpacity})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(eclipseCenter.x, eclipseCenter.y, eclipseRadius + 1, 0, Math.PI * 2);
      ctx.stroke();

      // Draw twinkling stars
      stars.forEach(star => {
        // Twinkling animation
        star.opacity = star.baseOpacity + Math.sin(time * star.twinkleSpeed + star.phase) * 0.4;
        
        // Subtle drift
        star.x += Math.sin(time * 0.0005 + star.phase) * 0.1;
        star.y += Math.cos(time * 0.0003 + star.phase) * 0.05;
        
        // Wrap around edges
        if (star.x > canvas.width) star.x = 0;
        if (star.x < 0) star.x = canvas.width;
        if (star.y > canvas.height) star.y = 0;
        if (star.y < 0) star.y = canvas.height;
        
        // Create star glow effect
        const starGradient = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, star.size * 3
        );
        starGradient.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`);
        starGradient.addColorStop(0.3, `rgba(200, 220, 255, ${star.opacity * 0.6})`);
        starGradient.addColorStop(1, `rgba(200, 220, 255, 0)`);
        
        ctx.fillStyle = starGradient;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Star core
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add sparkle effect to some stars
        if (Math.random() < 0.1 && star.opacity > 0.7) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${star.opacity * 0.8})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(star.x - star.size * 4, star.y);
          ctx.lineTo(star.x + star.size * 4, star.y);
          ctx.moveTo(star.x, star.y - star.size * 4);
          ctx.lineTo(star.x, star.y + star.size * 4);
          ctx.stroke();
        }
      });

      time++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="particles-background"
      style={{
        position: 'fixed',
        width: '100%',
        height: '100%',
        zIndex: 1,
        top: 0,
        left: 0
      }}
    />
  );
};

export default ParticlesBackground;