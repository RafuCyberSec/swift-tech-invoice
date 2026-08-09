
'use client';
import { useState, useRef, useEffect } from 'react';

export default function ResponsivePreviewWrapper({ children, targetWidth = 800, targetHeight = 1131 }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        // Calculate the scale needed to fit the preview in the container (with a small buffer)
        const newScale = Math.min(1, width / targetWidth);
        setScale(newScale);
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [targetWidth]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      <div 
        style={{ 
          width: targetWidth * scale, 
          height: targetHeight * scale,
          position: 'relative',
          flexShrink: 0
        }}
      >
        <div 
          style={{ 
            transform: \scale(\)\, 
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
            width: targetWidth,
            height: targetHeight
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

