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
    const placeholder = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><rect width="100%" height="100%" fill="%23000000"/><text x="50%" y="50%" font-size="36" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">No image available</text></svg>';
    const src = treasure.imageUrl || treasure.fallbackImage || placeholder;
    return (
      <div className={`treasure-card photo-card`} ref={cardRef}>
        {/* Render a real img element so nothing overlays it and it can be full-bleed */}
        <img className="photo-img" src={src} alt={treasure.name || 'Photo'} />
      </div>
    );
  }
  // Info card — if imageUrl is present we'll show it, otherwise render text-only info
  return (
    <div className={`treasure-card info-card ${treasure.imageUrl ? '' : 'info-only'}`} ref={cardRef}>
      {/* Keep a spacer where the image would be so info-only cards match the other cards' dimensions */}
      {!treasure.imageUrl && <div className="info-spacer" aria-hidden="true" />}
      {treasure.imageUrl && <div className="treasure-image" style={{ backgroundImage: `url(${treasure.imageUrl})` }} />}
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