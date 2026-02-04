'use client'

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const TestButtonColors: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a12',
      padding: '50px 20px',
      color: 'white'
    }}>
      <h1 style={{
        fontSize: '2.5rem',
        fontWeight: 'bold',
        marginBottom: '40px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, hsl(180 100% 48%), hsl(262 80% 60%))',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        Button Color Consistency Test
      </h1>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gap: '40px'
      }}>
        {/* Navigation Buttons Section */}
        <section style={{
          padding: '30px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#06b6d4' }}>
            Navigation Buttons (Header)
          </h2>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <Link href="/vaults" className="btn-cyber">
              <span>Launch App</span>
            </Link>
            <button className="btn-cyber">
              Connect Wallet
            </button>
          </div>
        </section>

        {/* Landing Page Buttons Section */}
        <section style={{
          padding: '30px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#8b5cf6' }}>
            Landing Page CTA Buttons
          </h2>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <Button
              className="font-bold"
              style={{
                background: 'linear-gradient(135deg, hsl(180 100% 48%), hsl(262 80% 60%))',
                color: 'hsl(216 100% 4%)',
                padding: '12px 32px',
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 0 20px hsl(180 100% 48% / 0.4), 0 0 40px hsl(180 100% 48% / 0.15)',
                transition: 'all 300ms ease-in-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 0 30px hsl(180 100% 48% / 0.5), 0 0 60px hsl(180 100% 48% / 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 20px hsl(180 100% 48% / 0.4), 0 0 40px hsl(180 100% 48% / 0.15)';
              }}
            >
              Start Earning
            </Button>
          </div>
        </section>

        {/* Color Specifications */}
        <section style={{
          padding: '30px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#f59e0b' }}>
            Color Specifications
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div>
              <h3 style={{ fontWeight: 'bold', marginBottom: '10px' }}>✅ Correct Gradient (Cyan to Purple)</h3>
              <div style={{
                background: 'linear-gradient(135deg, hsl(180 100% 48%), hsl(262 80% 60%))',
                height: '60px',
                borderRadius: '8px',
                marginBottom: '10px'
              }} />
              <code style={{ fontSize: '0.85rem', color: '#06b6d4' }}>
                linear-gradient(135deg, hsl(180 100% 48%), hsl(262 80% 60%))
              </code>
              <ul style={{ fontSize: '0.9rem', marginTop: '10px', opacity: 0.8 }}>
                <li>Start: hsl(180 100% 48%) - Cyan</li>
                <li>End: hsl(262 80% 60%) - Purple</li>
              </ul>
            </div>

            <div>
              <h3 style={{ fontWeight: 'bold', marginBottom: '10px' }}>❌ Old Gradient (Cyan to Teal)</h3>
              <div style={{
                background: 'linear-gradient(135deg, #06b6d4, #14b8a6)',
                height: '60px',
                borderRadius: '8px',
                marginBottom: '10px',
                opacity: 0.5
              }} />
              <code style={{ fontSize: '0.85rem', color: '#ef4444' }}>
                linear-gradient(135deg, #06b6d4, #14b8a6)
              </code>
              <ul style={{ fontSize: '0.9rem', marginTop: '10px', opacity: 0.5 }}>
                <li>Start: #06b6d4 - Cyan</li>
                <li>End: #14b8a6 - Teal (WRONG)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Implementation Details */}
        <section style={{
          padding: '30px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#06b6d4' }}>
            Implementation Details
          </h2>
          <pre style={{
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '20px',
            borderRadius: '8px',
            overflow: 'auto',
            fontSize: '0.85rem'
          }}>
{`.btn-cyber {
  background: linear-gradient(135deg, hsl(180 100% 48%), hsl(262 80% 60%)) !important;
  color: hsl(216 100% 4%) !important;
  border: none !important;
  box-shadow:
    0 0 20px hsl(180 100% 48% / 0.4),
    0 0 40px hsl(180 100% 48% / 0.15);
}

/* Applied to:
  - Launch App button (Navigation)
  - Connect Wallet button
  - All btn-cyber class buttons
*/`}
          </pre>
        </section>
      </div>
    </div>
  );
};

export default TestButtonColors;