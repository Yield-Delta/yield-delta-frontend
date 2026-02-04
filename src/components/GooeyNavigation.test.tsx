import React from 'react';
import GooeyNav from './GooeyNavigation';

// Test component to verify GooeyNavigation improvements
const GooeyNavigationTest: React.FC = () => {
  const navigationItems = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Services', href: '/services' },
    { label: 'Portfolio', href: '/portfolio' },
    { label: 'Contact', href: '/contact' },
  ];

  const handleItemChange = (index: number, item: { label: string; href: string }) => {
    console.log(`Navigation changed to: ${item.label} (${item.href}) at index ${index}`);
  };

  return (
    <div style={{ padding: '50px', background: '#1a1a2e' }}>
      <h1 style={{ color: 'white', marginBottom: '40px' }}>GooeyNavigation Test</h1>

      <GooeyNav
        items={navigationItems}
        animationTime={600}
        particleCount={20}
        particleDistances={[100, 15]}
        particleR={120}
        timeVariance={400}
        colors={[1, 2, 3, 4]}
        initialActiveIndex={0}
        preventNavigation={true}
        onItemChange={handleItemChange}
      />

      <div style={{ color: 'white', marginTop: '60px' }}>
        <h2>Improvements Made:</h2>
        <ul>
          <li>✅ Fixed event handling bug (li element positioning)</li>
          <li>✅ Added proper memory cleanup for timeouts and animation frames</li>
          <li>✅ Enhanced accessibility with ARIA roles and keyboard navigation</li>
          <li>✅ Optimized particle animations with DocumentFragment batching</li>
          <li>✅ Added preventNavigation prop to control link behavior</li>
          <li>✅ Added onItemChange callback for tracking navigation</li>
          <li>✅ Improved keyboard navigation (Home/End keys support)</li>
          <li>✅ Better TypeScript types and error handling</li>
          <li>✅ Memoized rendering for better performance</li>
          <li>✅ ResizeObserver for responsive updates</li>
        </ul>
      </div>
    </div>
  );
};

export default GooeyNavigationTest;