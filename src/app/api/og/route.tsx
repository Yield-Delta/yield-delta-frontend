import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract parameters
    const title = searchParams.get('title') || 'Yield Delta';
    const subtitle = searchParams.get('subtitle') || 'Dynamic Liquidity Vaults on SEI';
    const description = searchParams.get('description') || 'AI-driven yield aggregation, concentrated liquidity, and impermanent loss hedging on SEI EVM.';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            backgroundImage: 'linear-gradient(135deg, #0a0f1c 0%, #1a1f2e 50%, #0a0f1c 100%)',
            padding: '60px',
            position: 'relative',
          }}
        >
          {/* Neural Grid Background */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              backgroundImage: `
                linear-gradient(#9b5de5 1px, transparent 1px),
                linear-gradient(90deg, #9b5de5 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />
          
          {/* Glow Effects */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '100px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(155, 93, 229, 0.3) 0%, rgba(155, 93, 229, 0) 70%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '100px',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(155, 93, 229, 0.2) 0%, rgba(155, 93, 229, 0) 70%)',
            }}
          />
          
          {/* Logo Section */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            {/* Simple Logo Representation */}
            <div
              style={{
                width: '80px',
                height: '80px',
                marginRight: '30px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Delta Shape */}
              <div
                style={{
                  width: '0',
                  height: '0',
                  borderLeft: '25px solid transparent',
                  borderRight: '25px solid transparent',
                  borderBottom: '40px solid #00f5d4',
                  position: 'absolute',
                }}
              />
              {/* AI Core */}
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#9b5de5',
                  position: 'absolute',
                  boxShadow: '0 0 20px #9b5de5',
                }}
              />
            </div>
            
            {/* Chain ID Badge */}
            <div
              style={{
                position: 'absolute',
                top: '60px',
                right: '60px',
                padding: '15px 30px',
                border: '2px solid #9b5de5',
                borderRadius: '30px',
                background: 'rgba(155, 93, 229, 0.1)',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#9b5de5',
              }}
            >
              Chain ID: 1328
            </div>
          </div>
          
          {/* Main Title */}
          <div
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #00f5d4, #9b5de5, #ff206e)',
              backgroundClip: 'text',
              color: 'transparent',
              marginBottom: '20px',
              textShadow: '0 0 30px rgba(155, 93, 229, 0.5)',
            }}
          >
            {title}
          </div>
          
          {/* Subtitle */}
          <div
            style={{
              fontSize: '36px',
              fontWeight: '600',
              color: '#00f5d4',
              marginBottom: '20px',
            }}
          >
            {subtitle}
          </div>
          
          {/* Description */}
          <div
            style={{
              fontSize: '24px',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '40px',
              maxWidth: '800px',
            }}
          >
            {description}
          </div>
          
          {/* Key Features */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
            }}
          >
            <div style={{ fontSize: '20px', color: '#9b5de5', fontWeight: '600' }}>
              ⚡ 400ms Finality
            </div>
            <div style={{ fontSize: '20px', color: '#00f5d4', fontWeight: '600' }}>
              🤖 AI-Powered Optimization
            </div>
            <div style={{ fontSize: '20px', color: '#ff206e', fontWeight: '600' }}>
              💎 Liquidity Mining
            </div>
          </div>
          
          {/* URL */}
          <div
            style={{
              position: 'absolute',
              bottom: '60px',
              left: '60px',
              fontSize: '18px',
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            yielddelta.xyz
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: unknown) {
    console.log(`${e instanceof Error ? e.message : 'Unknown error'}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
