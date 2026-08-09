'use client';

import { useState, useEffect } from 'react';

export default function SplashScreen({ children }) {
  const [showSplash, setShowSplash] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Only show splash once per browser session
    const hasSeenSplash = sessionStorage.getItem('splashShown');
    if (hasSeenSplash) {
      setDone(true);
      return;
    }

    setShowSplash(true);
    sessionStorage.setItem('splashShown', 'true');

    // Start fade out after 2.2s
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2200);

    // Remove splash after fade animation (0.6s)
    const removeTimer = setTimeout(() => {
      setShowSplash(false);
      setDone(true);
    }, 2800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (done && !showSplash) {
    return <>{children}</>;
  }

  return (
    <>
      {showSplash && (
        <div className={`splash-screen ${fadeOut ? 'splash-fade-out' : ''}`}>
          {/* Animated background particles */}
          <div className="splash-particles">
            <div className="splash-particle splash-particle-1" />
            <div className="splash-particle splash-particle-2" />
            <div className="splash-particle splash-particle-3" />
            <div className="splash-particle splash-particle-4" />
          </div>

          {/* Glow ring behind logo */}
          <div className="splash-glow-ring" />

          {/* Logo */}
          <div className="splash-logo-container">
            <img
              src="/logo.svg"
              alt="Swift Tech & Games"
              className="splash-logo"
            />
          </div>

          {/* Company name */}
          <div className="splash-text">
            <span className="splash-text-swift">Swift Tech</span>
            <span className="splash-text-amp">&</span>
            <span className="splash-text-games">Games</span>
          </div>

          {/* Tagline */}
          <div className="splash-tagline">Invoice Manager</div>

          {/* Loading bar */}
          <div className="splash-loader">
            <div className="splash-loader-bar" />
          </div>
        </div>
      )}
      {done && children}
    </>
  );
}
