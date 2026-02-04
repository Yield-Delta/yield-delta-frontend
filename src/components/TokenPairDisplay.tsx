import React from 'react';
import { getTokenInfo } from '@/utils/tokenUtils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface TokenPairDisplayProps {
  tokenA: string;
  tokenB: string;
  size?: number;
}

export default function TokenPairDisplay({ tokenA, tokenB, size = 44 }: TokenPairDisplayProps) {
  const tokenAInfo = getTokenInfo(tokenA);
  const tokenBInfo = getTokenInfo(tokenB);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.18 }}>
      <div style={{
        position: 'relative',
        width: size * 1.6,
        height: size,
        display: 'flex',
        alignItems: 'center',
      }}>
        {/* Token A */}
        <Avatar style={{
          width: size,
          height: size,
          border: `3px solid #fff`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
          zIndex: 2,
          background: 'linear-gradient(135deg, #fff8, #fff2)',
          position: 'absolute',
          left: 0,
        }}>
          <AvatarFallback style={{ fontWeight: 900, fontSize: size * 0.48 }}>
            {tokenAInfo?.symbol.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
        {/* Token B, slightly overlapped */}
        <Avatar style={{
          width: size,
          height: size,
          border: `3px solid #fff`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
          zIndex: 1,
          background: 'linear-gradient(135deg, #fff8, #fff2)',
          position: 'absolute',
          left: size * 0.7,
        }}>
          <AvatarFallback style={{ fontWeight: 900, fontSize: size * 0.48 }}>
            {tokenBInfo?.symbol.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
      </div>
      <span style={{ fontWeight: 700, fontSize: size * 0.38, color: '#fff', textShadow: '0 1px 4px #0008' }}>
        {tokenAInfo?.symbol || tokenA} / {tokenBInfo?.symbol || tokenB}
      </span>
    </div>
  );
}
