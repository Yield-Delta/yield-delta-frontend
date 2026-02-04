"use client"

import React from 'react';
import { useEffect, useRef } from 'react';
import styles from './VerticalRays.module.css';

export default function VerticalRays({ className = '', style = {} }) {
  const raysRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Optional: Add interactive effects on hover or scroll
    const handleMouseMove = (e: MouseEvent) => {
      if (raysRef.current) {
        const rect = raysRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        
        // Subtle parallax effect on data streams
        const streams = raysRef.current.querySelectorAll('[class*="dataStream"]');
        streams.forEach((stream, i) => {
          const element = stream as HTMLElement;
          const offset = (percentage - 0.5) * 10 * (i % 2 === 0 ? 1 : -1);
          element.style.transform = `translateX(${offset}px)`;
        });
      }
    };

    const container = raysRef.current?.parentElement;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', () => {
        // Reset transforms on mouse leave
        if (raysRef.current) {
          const streams = raysRef.current.querySelectorAll('[class*="dataStream"]');
          streams.forEach((stream) => {
            const element = stream as HTMLElement;
            element.style.transform = '';
          });
        }
      });

      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, []);

  return (
    <div
      ref={raysRef}
      className={`${styles.verticalRays} ${className}`}
      style={style}
    >
      {/* Multiple data streams with different positions and delays */}
      <div className={`${styles.dataStream} ${styles.dataStreamLeft}`} />
      <div className={`${styles.dataStream} ${styles.dataStreamSecondaryLeft}`} />
      <div className={`${styles.dataStream} ${styles.dataStreamCenter}`} />
      <div className={`${styles.dataStream} ${styles.dataStreamSecondaryRight}`} />
      <div className={`${styles.dataStream} ${styles.dataStreamRight}`} />
    </div>
  );
}
