import React, { useRef, useEffect } from 'react';

const FloatingImages = () => {
  const mountRef = useRef(null);
  const imagesRef = useRef([]);

  useEffect(() => {
    const mount = mountRef.current;
    const images = [];
    const numImages = 15;
    const icons = ['⚖️', '📜', '🔍', '📋', '✍️'];

    for (let i = 0; i < numImages; i++) {
      const image = document.createElement('div');
      image.className = 'absolute text-2xl opacity-10';
      image.textContent = icons[Math.floor(Math.random() * icons.length)];
      image.style.left = `${Math.random() * 100}%`;
      image.style.top = `${Math.random() * 100}%`;
      image.style.animation = `float ${8 + Math.random() * 12}s linear infinite`;
      image.style.transform = `rotate(${Math.random() * 360}deg)`;
      images.push(image);
      mount.appendChild(image);
    }

    imagesRef.current = images;

    return () => {
      images.forEach(image => {
        mount.removeChild(image);
      });
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 overflow-hidden pointer-events-none" />;
};

export default FloatingImages;