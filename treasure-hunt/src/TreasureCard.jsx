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

  // Types: 'info' => shows name, description and image
  //        'photo' => image only (or small caption)
  //        'points' => hidden until clicked
  
  // Use a highly reliable placeholder if no image is available, preventing the "broken image" icon
  const fallbackImage = 'https://placehold.co/1000x500/101827/fff?text=Image+Not+Found';

  if (treasure.type === 'points') {
    return (
      <div className="treasure-card points-card" ref={cardRef} onClick={handlePointsClick}>
        {!isRevealed ? (
          <div className="points-card-hidden">
            <div className="question">?</div>
            <h3 className="points-title">{treasure.name || 'Reveal'}</h3>
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
  // Photo-only card: render only the image (no overlay/title)
  if (treasure.type === 'photo') {
    const src = treasure.imageUrl || fallbackImage;
    return (
      <div className={`treasure-card photo-card`} ref={cardRef}>
        {/* Render a real img element so nothing overlays it and it can be full-bleed */}
        <img className="photo-img" src={src} alt={treasure.name || 'Photo'} 
             // Add an error handler to ensure a visual fallback if the URL fails
             onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }}
        />
      </div>
    );
  }
  
  // Info card — now also shows an image if one is available
  const showImageInInfoCard = !!treasure.imageUrl;

  return (
    <div className={`treasure-card info-card ${showImageInInfoCard ? '' : 'info-only'}`} ref={cardRef}>
      {/* If there's no image, use a spacer to maintain layout */}
      {!showImageInInfoCard && <div className="info-spacer" aria-hidden="true" />}
      
      {/* If there is an image, display it */}
      {showImageInInfoCard && (
        <div className="treasure-image" style={{ backgroundImage: `url(${treasure.imageUrl})` }} />
      )}
      
      <div className="treasure-info">
        <h3>{treasure.name}</h3>
        {treasure.fact && treasure.fact.split('\n').map((line, i) => (
          <p key={i} className="treasure-desc">{line}</p>
        ))}
      </div>
    </div>
  );
};

export default TreasureCard;