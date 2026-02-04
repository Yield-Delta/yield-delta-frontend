'use client'

import React from 'react';
import GooeyNav from '@/components/GooeyNavigation';
import '@/components/GooeyNav.css';

const TestGooeyPage: React.FC = () => {
  const navigationItems = [
    { label: 'Vaults', href: '/vaults' },
    { label: 'Market', href: '/market' },
    { label: 'Charts', href: '/charts' },
    { label: 'Sentiment', href: '/market-sentiment' },
    { label: 'Portfolio', href: '/dashboard' },
    { label: 'Rebalance', href: '/portfolio/rebalance' },
    { label: 'Docs', href: '/docs' },
  ];

  const handleItemChange = (index: number, item: { label: string; href: string }) => {
    console.log(`Navigation changed to: ${item.label} (${item.href}) at index ${index}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a12', padding: '50px' }}>
      <h1 style={{ color: 'white', marginBottom: '60px', textAlign: 'center', fontSize: '2.5rem', fontWeight: 'bold' }}>
        GooeyNavigation Component Demo
      </h1>

      <div style={{ height: '200px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
          onItemChange={handleItemChange}
        />
      </div>

      <div style={{ color: 'white', marginTop: '100px', padding: '0 20px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#06b6d4' }}>Features & Improvements</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '30px' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
            <h3 style={{ color: '#06b6d4', marginBottom: '10px' }}>✨ Enhanced Performance</h3>
            <ul style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              <li>Optimized particle animations with DocumentFragment</li>
              <li>Memoized rendering and callbacks</li>
              <li>Proper memory cleanup for timeouts</li>
              <li>Efficient batch DOM operations</li>
            </ul>
          </div>

          <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <h3 style={{ color: '#8b5cf6', marginBottom: '10px' }}>🎯 Better Accessibility</h3>
            <ul style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              <li>ARIA roles and labels</li>
              <li>Keyboard navigation (Arrow, Home, End keys)</li>
              <li>Focus management and indicators</li>
              <li>Screen reader support</li>
            </ul>
          </div>

          <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <h3 style={{ color: '#6366f1', marginBottom: '10px' }}>🛠 Developer Experience</h3>
            <ul style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              <li>TypeScript support with proper types</li>
              <li>preventNavigation prop for SPAs</li>
              <li>onItemChange callback for tracking</li>
              <li>Customizable particle effects</li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: '40px', padding: '20px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px' }}>
          <h3 style={{ color: '#f59e0b', marginBottom: '10px' }}>🎨 Configuration Options</h3>
          <pre style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem', overflow: 'auto' }}>
{`<GooeyNav
  items={navigationItems}
  particleCount={15}          // Number of particles
  particleDistances={[90, 10]} // Start and end distances
  particleR={100}              // Particle rotation range
  initialActiveIndex={0}       // Starting active item
  animationTime={600}          // Animation duration
  timeVariance={300}           // Animation time variance
  colors={[1, 2, 3, 4]}       // Color scheme indices
  preventNavigation={true}     // Prevent default navigation
  onItemChange={handler}       // Change callback
/>`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default TestGooeyPage;