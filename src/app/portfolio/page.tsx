"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const PortfolioRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#07080f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Dot-grid background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(153,69,255,0.18) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 40%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '300px',
          background: 'radial-gradient(ellipse at center, rgba(153,69,255,0.09) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 28 }}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          padding: '44px 56px',
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(153,69,255,0.14)',
          borderRadius: '20px',
          overflow: 'hidden',
          minWidth: '300px',
        }}
      >
        {/* Top shimmer */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent 5%, #9945FF 35%, #14F195 65%, transparent 95%)',
          }}
        />

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          style={{
            margin: 0,
            fontSize: '2rem',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, #9945FF, #14F195)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1,
          }}
        >
          Portfolio
        </motion.h1>

        {/* Spinner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '2px solid rgba(20,241,149,0.1)',
            borderTopColor: '#14F195',
            animation: 'yd-spin 0.8s linear infinite',
            boxShadow: '0 0 12px rgba(20,241,149,0.15)',
          }}
        />

        {/* Pill badge */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            background: 'rgba(20,241,149,0.07)',
            border: '1px solid rgba(20,241,149,0.18)',
            borderRadius: '999px',
          }}
        >
          <span
            style={{
              display: 'block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#14F195',
              boxShadow: '0 0 8px #14F195',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '0.6rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.28)',
            }}
          >
            Redirecting to Dashboard
          </span>
        </motion.div>

        {/* Bottom accent */}
        <div
          style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent 5%, rgba(153,69,255,0.3) 50%, transparent 95%)',
          }}
        />
      </motion.div>

      <style>{`@keyframes yd-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default PortfolioRedirect;
