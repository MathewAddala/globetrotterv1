import React, { useState, useRef } from 'react';

const TreasureCard = ({ treasure, onPointsReveal }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const cardRef = useRef(null);

  const handlePointsClick = () => {
    if (isRevealed) return;
    setIsRevealed(true);
    createStarBlast();
    if (onPointsReveal) onPointsReveal(treasure.points || 0);
  };

  const createStarBlast = () => {
    const el = cardRef.current;
    if (!el) return;
    const container = document.createElement('div');
    container.className = 'star-blast-container';
    for (let i = 0; i < 18; i++) {
      const star = document.createElement('div');
      star.className = 'star-particle';
      const size = Math.floor(Math.random() * 8) + 6;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = '50%';
      star.style.top = '50%';
      star.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`;
      container.appendChild(star);
      (function animateParticle(s) {
        const dx = (Math.random() - 0.5) * 300;
        const dy = (Math.random() - 0.5) * 200 - 40;
        const rot = Math.random() * 720;
        s.animate([
          { transform: 'translate(-50%, -50%) scale(0.2) rotate(0deg)', opacity: 1 },
          { transform: `translate(${dx}px, ${dy}px) scale(1) rotate(${rot}deg)`, opacity: 0 }
        ], { duration: 900 + Math.random() * 400, easing: 'cubic-bezier(.2,.9,.3,1)' });
      })(star);
    }
    el.appendChild(container);
    setTimeout(() => container.remove(), 1600);
  };

  const fallbackImage = 'https://placehold.co/1000x500/5C3D2E/E0C097?text=Map+Fragment';

  if (treasure.type === 'points') {
    return (
      <div className="treasure-card-revamped points-card" ref={cardRef} onClick={handlePointsClick}>
        {!isRevealed ? (
          <div className="points-hidden">
            <span className="points-question-mark">X</span>
            <h3>{treasure.name || 'Doubloons'}</h3>
          </div>
        ) : (
          <div className="points-revealed">
            <div className="points-value">{treasure.points}</div>
            <div className="points-label">POINTS</div>
          </div>
        )}
      </div>
    );
  }

  // Photo-only card: Renders just the image in the themed frame.
  if (treasure.type === 'photo') {
      return (
          <div className="treasure-card-revamped photo-card" ref={cardRef}>
              <div className="card-image" style={{ backgroundImage: `url(${treasure.imageUrl || fallbackImage})`, height: '100%' }} />
          </div>
      );
  }
  
  // Info card with scrollable description
  return (
    <div className="treasure-card-revamped" ref={cardRef}>
      <div className="card-image" style={{ backgroundImage: `url(${treasure.imageUrl || fallbackImage})` }}>
          <div className="card-image-overlay"></div>
      </div>
      <div className="card-content">
        <h3>{treasure.name}</h3>
        <p className="card-description">{treasure.fact}</p>
      </div>
    </div>
  );
};

export default TreasureCard;