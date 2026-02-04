'use client'

import React from 'react';
import GooeyNav from '@/components/GooeyNavigation';
import '@/components/GooeyNav.css';

const TestNavUpdates: React.FC = () => {
  const navigationItems = [
    { label: 'Vaults', href: '/vaults' },
    { label: 'Market', href: '/market' },
    { label: 'Charts', href: '/charts' },
    { label: 'Sentiment', href: '/market-sentiment' },
    { label: 'Portfolio', href: '/dashboard' },
    { label: 'Rebalance', href: '/portfolio/rebalance' },
    { label: 'Docs', href: '/docs' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a12 0%, #0f1724 50%, #0a0a12 100%)',
      padding: '50px 20px'
    }}>
      <h1 style={{
        color: 'white',
        marginBottom: '60px',
        textAlign: 'center',
        fontSize: '2.5rem',
        fontWeight: 'bold',
        background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #6366f1 100%)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        Updated Navigation Design
      </h1>

      {/* Navigation Demo */}
      <div style={{
        height: '200px',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '80px'
      }}>
        <div style={{ maxWidth: '900px', width: '100%' }}>
          <GooeyNav
            items={navigationItems}
            particleCount={15}
            particleDistances={[90, 10]}
            particleR={100}
            initialActiveIndex={0}
            animationTime={600}
            timeVariance={300}
            colors={[1, 2, 3, 1, 2, 3, 1, 4]}
            preventNavigation={true}
            onItemChange={(index, item) => {
              console.log(`Selected: ${item.label} (index: ${index})`);
            }}
          />
        </div>
      </div>

      {/* Changes Summary */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <h2 style={{
          color: '#06b6d4',
          fontSize: '2rem',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          Design Updates
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {/* Centering Update */}
          <div style={{
            background: 'rgba(6, 182, 212, 0.05)',
            padding: '25px',
            borderRadius: '16px',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{
              color: '#06b6d4',
              marginBottom: '15px',
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '1.5rem' }}>🎯</span>
              Centered Navigation
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              lineHeight: '1.6',
              fontSize: '0.95rem'
            }}>
              Navigation is now perfectly centered in the header with proper flexbox alignment
              and responsive behavior across all screen sizes.
            </p>
          </div>

          {/* Color Update */}
          <div style={{
            background: 'rgba(139, 92, 246, 0.05)',
            padding: '25px',
            borderRadius: '16px',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{
              color: '#8b5cf6',
              marginBottom: '15px',
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '1.5rem' }}>🎨</span>
              Gradient Pill Design
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              lineHeight: '1.6',
              fontSize: '0.95rem'
            }}>
              Replaced white background with a beautiful cyan-purple-indigo gradient that
              matches the overall design system. Added glowing effects for better visual feedback.
            </p>
          </div>

          {/* Underline Removal */}
          <div style={{
            background: 'rgba(99, 102, 241, 0.05)',
            padding: '25px',
            borderRadius: '16px',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{
              color: '#6366f1',
              marginBottom: '15px',
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '1.5rem' }}>✨</span>
              Clean Hover Effects
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              lineHeight: '1.6',
              fontSize: '0.95rem'
            }}>
              Removed underline effects for a cleaner look. Added subtle color transitions
              and transform animations on hover for better user interaction.
            </p>
          </div>

          {/* Bug Fix */}
          <div style={{
            background: 'rgba(20, 184, 166, 0.05)',
            padding: '25px',
            borderRadius: '16px',
            border: '1px solid rgba(20, 184, 166, 0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{
              color: '#14b8a6',
              marginBottom: '15px',
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '1.5rem' }}>🐛</span>
              Black Box Fix
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              lineHeight: '1.6',
              fontSize: '0.95rem'
            }}>
              Fixed the black box issue that appeared when clicking navigation items by
              removing the opaque background and adjusting blend modes.
            </p>
          </div>
        </div>

        {/* Color Palette Display */}
        <div style={{
          marginTop: '40px',
          padding: '30px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{
            color: 'white',
            marginBottom: '20px',
            fontSize: '1.25rem'
          }}>
            Particle Color Palette
          </h3>
          <div style={{
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: '#06b6d4',
                borderRadius: '50%',
                margin: '0 auto 10px',
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)'
              }} />
              <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>Cyan</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: '#8b5cf6',
                borderRadius: '50%',
                margin: '0 auto 10px',
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)'
              }} />
              <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>Purple</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: '#6366f1',
                borderRadius: '50%',
                margin: '0 auto 10px',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)'
              }} />
              <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>Indigo</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: '#14b8a6',
                borderRadius: '50%',
                margin: '0 auto 10px',
                boxShadow: '0 0 20px rgba(20, 184, 166, 0.5)'
              }} />
              <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>Teal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestNavUpdates;