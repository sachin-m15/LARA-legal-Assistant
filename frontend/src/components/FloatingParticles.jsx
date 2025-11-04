import React, { useRef, useEffect } from 'react';

const FloatingParticles = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const particles = [];
    const numParticles = 50;

    for (let i = 0; i < numParticles; i++) {
      const particle = document.createElement('div');
      particle.className = 'absolute w-1 h-1 bg-gray-500 rounded-full opacity-20';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animation = `float ${5 + Math.random() * 10}s linear infinite`;
      particles.push(particle);
      mount.appendChild(particle);
    }

    return () => {
      particles.forEach(particle => {
        mount.removeChild(particle);
      });
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 z-0" />;
};

export default FloatingParticles;