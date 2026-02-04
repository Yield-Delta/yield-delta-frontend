"use client"

import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const workflowSteps = [
  { 
    id: 'deposit', 
    title: 'User Deposit', 
    description: 'Capital enters the protocol',
    icon: '💰',
    color: '#00f5d4'
  },
  { 
    id: 'analysis', 
    title: 'AI Analysis', 
    description: 'ElizaOS analyzes market conditions',
    icon: '🧠',
    color: '#9b5de5'
  },
  { 
    id: 'allocation', 
    title: 'Smart Allocation', 
    description: 'Funds distributed across strategies',
    icon: '⚡',
    color: '#ff206e'
  },
  { 
    id: 'optimization', 
    title: 'Continuous Optimization', 
    description: 'Real-time strategy adjustments',
    icon: '🔄',
    color: '#00f5d4'
  },
  { 
    id: 'returns', 
    title: 'Enhanced Returns', 
    description: 'Maximized yield with reduced risk',
    icon: '📈',
    color: '#9b5de5'
  }
];

export default function AIWorkflow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);
  const connectorsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create timeline for workflow animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 70%",
        end: "bottom 30%",
        scrub: 1,
        onEnter: () => {
          // Animate steps in sequence
          stepsRef.current.forEach((step, index) => {
            if (step) {
              gsap.fromTo(step,
                { opacity: 0, scale: 0.5, y: 50 },
                { 
                  opacity: 1, 
                  scale: 1, 
                  y: 0,
                  duration: 0.6,
                  delay: index * 0.2,
                  ease: "back.out(1.7)"
                }
              );
            }
          });

          // Animate connectors after steps
          connectorsRef.current.forEach((connector, index) => {
            if (connector) {
              gsap.fromTo(connector,
                { scaleX: 0 },
                { 
                  scaleX: 1,
                  duration: 0.5,
                  delay: (index + 1) * 0.2 + 0.3,
                  ease: "power2.out"
                }
              );
            }
          });
        }
      }
    });

    console.log('[AIWorkflow] GSAP timeline created with duration:', tl.duration());

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="py-16 relative"
      style={{
        paddingTop: '4rem',
        paddingBottom: '4rem',
        marginTop: '-2rem',
        minHeight: '70vh',
        overflow: 'visible',
        background: 'linear-gradient(180deg, rgba(20, 20, 30, 0.95) 0%, rgba(0, 245, 212, 0.08) 15%, rgba(155, 93, 229, 0.06) 40%, rgba(255, 32, 110, 0.08) 70%, rgba(20, 20, 30, 0.95) 100%)',
        position: 'relative'
      }}
    >
      {/* Enhanced Seamless Blending Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.15) 10%, transparent 25%, transparent 75%, rgba(0,0,0,0.15) 90%, rgba(0,0,0,0.3) 100%)',
          zIndex: 3
        }}
      />
      
      {/* Additional Top Blending Layer */}
      <div 
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: '120px',
          background: 'linear-gradient(180deg, rgba(20, 20, 30, 1) 0%, rgba(20, 20, 30, 0.8) 30%, rgba(20, 20, 30, 0.4) 60%, transparent 100%)',
          zIndex: 4
        }}
      />
      
      <style jsx>{`
        /* Workflow container responsive flex fix */
        .workflow-container {
          display: flex !important;
          flex-direction: column !important;
        }
        @media (min-width: 640px) {
          .workflow-container {
            flex-direction: row !important;
          }
        }

        /* Performance metrics container responsive flex fix */
        .performance-metrics-container {
          display: flex !important;
          flex-direction: column !important;
          gap: 1.5rem !important;
        }
        @media (min-width: 768px) {
          .performance-metrics-container {
            flex-direction: row !important;
            gap: 2rem !important;
          }
        }
        @media (min-width: 1024px) {
          .performance-metrics-container {
            gap: 3rem !important;
          }
        }

        /* Smooth horizontal scrolling */
        .overflow-x-auto {
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--primary) / 0.5) transparent;
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }
        .overflow-x-auto::-webkit-scrollbar {
          height: 6px;
        }
        .overflow-x-auto::-webkit-scrollbar-track {
          background: transparent;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: hsl(var(--primary) / 0.5);
          border-radius: 3px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary) / 0.7);
        }
        @keyframes flowMove {
          0% { transform: translateX(-100%) translateY(-50%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(4rem) translateY(-50%); opacity: 0; }
        }
        @keyframes streamFlow {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
        @keyframes animate-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: animate-float 6s ease-in-out infinite;
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .ai-title-override {
          font-size: 4rem !important;
          font-weight: 700 !important;
          color: hsl(var(--foreground)) !important;
          margin-bottom: 2rem !important;
          text-align: center !important;
          line-height: 1.2 !important;
        }
        .ai-description-override {
          font-size: 1.75rem !important;
          color: hsl(var(--muted-foreground)) !important;
          line-height: 1.5 !important;
          text-align: center !important;
          font-weight: 400 !important;
        }
        .ai-character-override {
          font-size: 8rem !important;
          filter: drop-shadow(0 0 30px hsl(var(--primary))) !important;
        }
        .performance-metrics-text-override {
          font-size: 1.5rem !important;
          background: linear-gradient(45deg, #9b5de5, #00f5d4, #ff206e) !important;
          background-size: 200% 200% !important;
          background-clip: text !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          color: transparent !important;
          font-weight: 700 !important;
          text-align: center !important;
          white-space: nowrap !important;
          display: block !important;
          animation: gradientShift 3s ease-in-out infinite !important;
          text-shadow: none !important;
        }
        .performance-card-label-cyan {
          font-size: clamp(0.75rem, 3.5vw, 1.25rem) !important;
          font-weight: 700 !important;
          color: white !important;
          text-decoration: underline !important;
          text-decoration-color: #00f5d4 !important;
          text-decoration-thickness: clamp(2px, 0.5vw, 3px) !important;
          text-underline-offset: clamp(4px, 1vw, 6px) !important;
          text-shadow: 0 0 12px #00f5d4, 0 0 24px #00f5d4, 0 0 36px #00f5d4 !important;
          filter: drop-shadow(0 0 8px #00f5d4) !important;
        }
        .performance-card-label-purple {
          font-size: clamp(0.75rem, 3.5vw, 1.25rem) !important;
          font-weight: 700 !important;
          color: white !important;
          text-decoration: underline !important;
          text-decoration-color: #9b5de5 !important;
          text-decoration-thickness: clamp(2px, 0.5vw, 3px) !important;
          text-underline-offset: clamp(4px, 1vw, 6px) !important;
          text-shadow: 0 0 12px #9b5de5, 0 0 24px #9b5de5, 0 0 36px #9b5de5 !important;
          filter: drop-shadow(0 0 8px #9b5de5) !important;
        }
        .performance-card-label-pink {
          font-size: clamp(0.75rem, 3.5vw, 1.25rem) !important;
          font-weight: 700 !important;
          color: white !important;
          text-decoration: underline !important;
          text-decoration-color: #ff206e !important;
          text-decoration-thickness: clamp(2px, 0.5vw, 3px) !important;
          text-underline-offset: clamp(4px, 1vw, 6px) !important;
          text-shadow: 0 0 12px #ff206e, 0 0 24px #ff206e, 0 0 36px #ff206e !important;
          filter: drop-shadow(0 0 8px #ff206e) !important;
        }
        .performance-card-metric {
          font-size: clamp(1.5rem, 6vw, 3rem) !important;
          font-weight: 800 !important;
          margin-bottom: 0.5rem !important;
        }
        .performance-metrics-divider-container {
          margin-top: 8rem !important;
          margin-bottom: 6rem !important;
          padding-top: 1rem !important;
          padding-bottom: 1rem !important;
        }
        .performance-metrics-enhanced-text {
          font-size: 2rem !important;
          font-weight: 700 !important;
          background: linear-gradient(135deg, #00f5d4, #9b5de5, #ff206e) !important;
          background-size: 200% 200% !important;
          background-clip: text !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          color: transparent !important;
          text-align: center !important;
          white-space: nowrap !important;
          display: block !important;
          animation: gradientShift 4s ease-in-out infinite !important;
          text-shadow: none !important;
          padding: 1.5rem 3rem !important;
          border-radius: 50px !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border: 2px solid transparent !important;
          background-origin: border-box !important;
          background-image: linear-gradient(135deg, rgba(0, 245, 212, 0.1), rgba(155, 93, 229, 0.1), rgba(255, 32, 110, 0.1)), 
                           linear-gradient(135deg, #00f5d4, #9b5de5, #ff206e) !important;
          background-clip: padding-box, text !important;
          -webkit-background-clip: padding-box, text !important;
          box-shadow: 0 8px 32px rgba(0, 245, 212, 0.2), 
                     0 0 0 1px rgba(255, 255, 255, 0.1), 
                     inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
        }
        .elizaos-subtitle-override {
          font-size: 1.75rem !important;
          color: hsl(var(--muted-foreground)) !important;
          line-height: 1.4 !important;
          font-weight: 400 !important;
          max-width: 64rem !important;
          margin: 0 auto !important;
          text-align: center !important;
        }
      `}</style>
      <div className="container mx-auto px-4 relative z-10" style={{ position: 'relative', zIndex: 10 }}>
        <div className="text-center mb-20">
          <h2 
            className="text-5xl lg:text-6xl font-bold mb-6 holo-text"
            style={{ 
              fontSize: 'clamp(3rem, 6vw, 4.5rem)',
              fontWeight: 'bold',
              marginBottom: '2rem',
              lineHeight: '1.1'
            }}
          >
            AI-Powered Liquidity Engine
          </h2>
          <p className="elizaos-subtitle-override">
            Watch how ElizaOS optimizes your capital in real-time across SEI&apos;s DeFi ecosystem
          </p>
        </div>

        {/* Workflow Steps */}
        <div className="relative py-8 md:py-12" style={{ paddingTop: '3rem', paddingBottom: '2rem' }}>
          <div className="workflow-container items-center justify-center gap-8 sm:gap-4 md:gap-8 lg:gap-16 px-4 lg:px-8 w-full pb-4 max-w-full sm:flex-nowrap" style={{ justifyContent: 'center' }}>
            {workflowSteps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center relative flex-shrink-0" style={{ minWidth: '140px', width: 'auto' }}>
                {/* Circular Step Card */}
                <div
                  ref={el => { stepsRef.current[index] = el; }}
                  className="cursor-pointer group relative overflow-visible transition-all duration-500 hover:scale-110"
                  style={{
                    width: 'clamp(120px, 15vw, 160px)',
                    height: 'clamp(120px, 15vw, 160px)',
                    flexShrink: 0,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {/* Outer Glow Ring */}
                  <div 
                    style={{
                      position: 'absolute',
                      top: '0',
                      left: '0',
                      right: '0',
                      bottom: '0',
                      borderRadius: '50%',
                      background: `conic-gradient(${step.color}, ${step.color}AA, ${step.color}, ${step.color}AA, ${step.color})`,
                      padding: '4px',
                      zIndex: 1,
                      width: '100%',
                      height: '100%',
                      display: 'block',
                      visibility: 'visible',
                      opacity: 1,
                      boxShadow: `0 0 40px ${step.color}, 0 0 80px ${step.color}80`,
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                    }}
                  >
                    <div 
                      className="w-full h-full rounded-full"
                      style={{ 
                        backgroundColor: 'hsl(var(--background)) !important',
                        borderRadius: '50% !important',
                        width: '100% !important',
                        height: '100% !important'
                      }}
                    ></div>
                  </div>

                  {/* Main Circle */}
                  <div 
                    style={{
                      position: 'absolute',
                      top: '4px',
                      left: '4px',
                      right: '4px',
                      bottom: '4px',
                      borderRadius: '50%',
                      background: `radial-gradient(circle at center, ${step.color}40, rgba(30, 30, 50, 0.95), ${step.color}20)`,
                      border: `4px solid ${step.color}`,
                      boxShadow: `0 0 60px ${step.color}, 0 0 120px ${step.color}60, inset 0 0 30px ${step.color}40`,
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      zIndex: 2,
                      width: 'calc(100% - 8px)',
                      height: 'calc(100% - 8px)',
                      display: 'block',
                      visibility: 'visible',
                      opacity: 1,
                      transition: 'all 0.5s ease'
                    }}
                  >
                    {/* Rotating Border Animation */}
                    <div 
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        left: '-4px',
                        right: '-4px',
                        bottom: '-4px',
                        borderRadius: '50%',
                        opacity: 0.8,
                        background: `conic-gradient(${step.color}, transparent, ${step.color}80, transparent, ${step.color})`,
                        boxShadow: `0 0 20px ${step.color}`,
                        animation: 'spin 3s linear infinite'
                      }}
                    ></div>

                    {/* Enhanced Icon with Glow - Centered */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div 
                        className="text-4xl transition-all duration-300 group-hover:text-5xl relative z-10"
                        style={{ 
                          filter: `drop-shadow(0 0 20px ${step.color}) drop-shadow(0 0 40px ${step.color}80)`,
                          textShadow: `0 0 20px ${step.color}, 0 0 40px ${step.color}80`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%'
                        }}
                      >
                        {step.icon}
                      </div>
                    </div>

                    {/* Pulsing Core */}
                    <div 
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full animate-pulse opacity-30"
                      style={{
                        background: `radial-gradient(circle, ${step.color}60, transparent)`
                      }}
                    ></div>

                    {/* Orbiting Particles */}
                    <div 
                      className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full animate-ping"
                      style={{ backgroundColor: step.color }}
                    ></div>
                    <div 
                      className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full animate-ping"
                      style={{ 
                        backgroundColor: step.color,
                        animationDelay: '1s'
                      }}
                    ></div>
                    <div 
                      className="absolute top-1/2 left-2 transform -translate-y-1/2 w-2 h-2 rounded-full animate-ping"
                      style={{ 
                        backgroundColor: step.color,
                        animationDelay: '0.5s'
                      }}
                    ></div>
                    <div 
                      className="absolute top-1/2 right-2 transform -translate-y-1/2 w-2 h-2 rounded-full animate-ping"
                      style={{ 
                        backgroundColor: step.color,
                        animationDelay: '1.5s'
                      }}
                    ></div>
                  </div>
                </div>

                {/* Step Labels Below Circle */}
                <div className="text-center mt-4 md:mt-6 max-w-[180px] md:max-w-[140px] px-2">
                  <h3 
                    style={{
                      fontSize: 'clamp(1.125rem, 3vw, 1.5rem) !important',
                      fontWeight: '700 !important',
                      color: 'hsl(var(--foreground)) !important',
                      marginBottom: '0.5rem !important',
                      textAlign: 'center',
                      lineHeight: '1.2 !important'
                    }}
                  >
                    {step.title}
                  </h3>
                  <p 
                    style={{
                      fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem) !important',
                      color: 'hsl(var(--muted-foreground)) !important',
                      lineHeight: '1.4 !important',
                      textAlign: 'center',
                      fontWeight: '400 !important'
                    }}
                  >
                    {step.description}
                  </p>
                </div>

                {/* Enhanced Connector Arrow - Vertical on mobile, horizontal on tablet/desktop */}
                {index < workflowSteps.length - 1 && (
                  <>
                    {/* Vertical Arrow for mobile only */}
                    <div
                      className="block sm:hidden absolute top-full left-1/2 transform -translate-x-1/2 z-10 mt-4"
                      style={{ height: 'clamp(2rem, 4vw, 4rem)', width: '4px' }}
                    >
                      {/* Main Arrow Line */}
                      <div
                        className="relative origin-top transition-all duration-500"
                        style={{
                          width: '4px !important',
                          height: '100% !important',
                          background: `linear-gradient(to bottom, ${workflowSteps[index].color}, ${workflowSteps[index + 1].color}) !important`,
                          boxShadow: `0 0 12px ${workflowSteps[index].color}60, 0 0 24px ${workflowSteps[index + 1].color}40 !important`,
                          borderRadius: '2px !important',
                          display: 'block !important',
                          opacity: '1 !important'
                        }}
                      >
                        {/* Animated Flow Dots */}
                        <div
                          className="absolute left-1/2 top-0 w-2 h-2 rounded-full transform -translate-x-1/2"
                          style={{
                            backgroundColor: workflowSteps[index].color,
                            animation: 'streamFlow 2s linear infinite',
                            boxShadow: `0 0 8px ${workflowSteps[index].color}`
                          }}
                        ></div>
                      </div>

                      {/* Arrow Head */}
                      <div
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1"
                        style={{ zIndex: 10 }}
                      >
                        <div
                          className="transition-all duration-300"
                          style={{
                            width: '0 !important',
                            height: '0 !important',
                            borderTop: `8px solid ${workflowSteps[index + 1].color} !important`,
                            borderLeft: '4px solid transparent !important',
                            borderRight: '4px solid transparent !important',
                            borderBottom: '0 !important',
                            filter: `drop-shadow(0 0 8px ${workflowSteps[index + 1].color}80) !important`,
                            display: 'block !important',
                            opacity: '1 !important'
                          }}
                        />
                      </div>
                    </div>

                    {/* Horizontal Arrow for tablet/desktop only */}
                    <div
                      className="hidden sm:block absolute left-full z-10"
                      style={{
                        width: 'clamp(2rem, 4vw, 4rem)',
                        top: 'calc(clamp(120px, 15vw, 160px) / 2)',
                        transform: 'translateY(-50%)'
                      }}
                    >
                      {/* Main Arrow Line */}
                      <div
                        ref={el => { connectorsRef.current[index] = el; }}
                        className="relative origin-left transition-all duration-500"
                        style={{
                          height: '4px !important',
                          width: '100% !important',
                          background: `linear-gradient(to right, ${workflowSteps[index].color}, ${workflowSteps[index + 1].color}) !important`,
                          boxShadow: `0 0 12px ${workflowSteps[index].color}60, 0 0 24px ${workflowSteps[index + 1].color}40 !important`,
                          borderRadius: '2px !important',
                          display: 'block !important',
                          opacity: '1 !important'
                        }}
                      >
                        {/* Animated Flow Dots */}
                        <div 
                          className="absolute top-1/2 left-0 w-2 h-2 rounded-full transform -translate-y-1/2 animate-bounce"
                          style={{
                            backgroundColor: workflowSteps[index].color,
                            animation: 'flowMove 2s linear infinite',
                            boxShadow: `0 0 8px ${workflowSteps[index].color}`
                          }}
                        ></div>
                      </div>
                      
                      {/* Arrow Head */}
                      <div 
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1"
                        style={{ zIndex: 10 }}
                      >
                        <div 
                          className="transition-all duration-300"
                          style={{
                            width: '0 !important',
                            height: '0 !important',
                            borderLeft: `8px solid ${workflowSteps[index + 1].color} !important`,
                            borderTop: '4px solid transparent !important',
                            borderBottom: '4px solid transparent !important',
                            borderRight: '0 !important',
                            filter: `drop-shadow(0 0 8px ${workflowSteps[index + 1].color}80) !important`,
                            display: 'block !important',
                            opacity: '1 !important'
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Central AI Character - Enhanced 3D Look */}
          <div className="mt-12 md:mt-24 flex flex-col items-center" style={{ marginTop: 'clamp(3rem, 8vw, 6rem)' }}>
            <div className="relative">
              <div 
                className="rounded-full backdrop-blur-xl border-2 flex items-center justify-center animate-float shadow-2xl"
                style={{
                  width: 'clamp(180px, 20vw, 240px) !important',
                  height: 'clamp(180px, 20vw, 240px) !important',
                  background: 'radial-gradient(circle at center, hsl(var(--primary) / 0.3), hsl(var(--secondary) / 0.2), hsl(var(--accent) / 0.3)) !important',
                  border: '2px solid hsl(var(--primary) / 0.4) !important',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)'
                }}
              >
                {/* Inner glow effect */}
                <div 
                  className="absolute rounded-full blur-sm"
                  style={{
                    inset: '1rem',
                    background: 'radial-gradient(circle at center, hsl(var(--primary) / 0.2), transparent)'
                  }}
                ></div>
                
                {/* AI Character */}
                <div className="relative z-10 animate-pulse ai-character-override">
                  🤖
                </div>
                
                {/* Rotating outer ring */}
                <div 
                  className="absolute inset-0 rounded-full animate-spin" 
                  style={{ 
                    animationDuration: '4s',
                    border: '2px solid hsl(var(--primary) / 0.6) !important'
                  }} 
                />
                
                {/* Counter-rotating inner ring */}
                <div 
                  className="absolute rounded-full animate-spin" 
                  style={{ 
                    animationDuration: '3s', 
                    animationDirection: 'reverse',
                    inset: '1.5rem',
                    border: '1px solid hsl(var(--secondary) / 0.6) !important'
                  }} 
                />
                
                {/* Pulsing dots */}
                <div 
                  className="absolute left-1/2 transform -translate-x-1/2 rounded-full animate-ping"
                  style={{
                    top: '-8px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: 'hsl(var(--primary))'
                  }}
                ></div>
                <div 
                  className="absolute left-1/2 transform -translate-x-1/2 rounded-full animate-ping"
                  style={{
                    bottom: '-8px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: 'hsl(var(--secondary))',
                    animationDelay: '0.5s'
                  }}
                ></div>
                <div 
                  className="absolute top-1/2 transform -translate-y-1/2 rounded-full animate-ping"
                  style={{
                    left: '-8px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: 'hsl(var(--accent))',
                    animationDelay: '1s'
                  }}
                ></div>
                <div 
                  className="absolute top-1/2 transform -translate-y-1/2 rounded-full animate-ping"
                  style={{
                    right: '-8px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: 'hsl(var(--primary))',
                    animationDelay: '1.5s'
                  }}
                ></div>
              </div>
            </div>
            
            {/* AI Description */}
            <div 
              className="mt-6 text-center max-w-md"
              style={{
                marginBottom: '8rem !important',
                paddingBottom: '4rem !important'
              }}
            >
              <h3 className="ai-title-override">
                AI-Powered Optimization
              </h3>
              <p className="ai-description-override">
                Our advanced AI continuously monitors market conditions, optimizes liquidity positions, and minimizes impermanent loss through intelligent rebalancing.
              </p>
            </div>
          </div>
        </div>

        {/* Section Divider */}
        <div className="performance-metrics-divider-container flex items-center justify-center">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent max-w-xs" style={{ height: '1px !important', background: 'linear-gradient(to right, transparent, hsl(var(--primary) / 0.3), transparent) !important' }}></div>
          <span className="performance-metrics-enhanced-text">
            Performance Metrics
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent max-w-xs" style={{ height: '1px !important', background: 'linear-gradient(to right, transparent, hsl(var(--primary) / 0.3), transparent) !important' }}></div>
        </div>

        {/* Performance Metrics */}
        <div
          className="max-w-5xl mx-auto px-4 md:px-6"
          style={{
            marginTop: 'clamp(4rem, 10vw, 8rem) !important',
            paddingTop: 'clamp(3rem, 8vw, 6rem) !important',
            marginBottom: '4rem !important'
          }}
        >
          <div className="performance-metrics-container flex flex-col md:flex-row justify-center items-center md:items-stretch gap-6 md:gap-8 lg:gap-12" style={{ justifyContent: 'center', alignItems: 'center' }}>
          {[
            { metric: '62%', label: 'Less Impermanent Loss', color: '#00f5d4' },
            { metric: '400ms', label: 'SEI Block Time', color: '#9b5de5' },
            { metric: '24/7', label: 'AI Monitoring', color: '#ff206e' }
          ].map((item, index) => (
            <Card
              key={index}
              className="cursor-pointer group relative overflow-hidden hover:scale-105 transition-all duration-300"
              style={{
                minWidth: 'clamp(180px, 30vw, 280px)',
                maxWidth: '320px',
                flex: '1 1 0',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '4px solid hsl(var(--primary) / 0.4)',
                background: 'hsl(var(--card) / 0.8)',
                borderRadius: '12px',
                padding: 'clamp(1rem, 3vw, 1.5rem)',
                boxShadow: '0 12px 48px hsl(var(--primary) / 0.25), inset 0 1px 0 hsl(var(--border) / 0.5)',
                textAlign: 'center',
                minHeight: 'clamp(100px, 15vw, 120px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.7)';
                e.currentTarget.style.boxShadow = '0 20px 80px hsl(var(--primary) / 0.35), inset 0 1px 0 hsl(var(--border) / 0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.4)';
                e.currentTarget.style.boxShadow = '0 12px 48px hsl(var(--primary) / 0.25), inset 0 1px 0 hsl(var(--border) / 0.5)';
              }}
            >
              {/* Background gradient effect */}
              <div 
                className="absolute inset-0 opacity-10 transition-opacity duration-500 group-hover:opacity-20"
                style={{
                  background: `linear-gradient(45deg, ${item.color}20, transparent)`
                }}
              />
              
              {/* Animated 3D Icon */}
              <div className="mb-2 md:mb-4 relative z-10 transform-gpu transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                <div
                  className="animate-pulse"
                  style={{
                    filter: `drop-shadow(0 6px 12px ${item.color}40)`,
                    transform: 'perspective(100px) rotateX(10deg)'
                  }}
                >
                  {index === 0 && (
                    <svg className="w-10 h-10 md:w-14 md:h-14 animate-bounce" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z"
                            stroke={item.color} strokeWidth="2.5" fill={`${item.color}20`}/>
                      <path d="M9 12L11 14L15 10" stroke={item.color} strokeWidth="2.5" fill="none"
                            className="animate-pulse"/>
                    </svg>
                  )}
                  {index === 1 && (
                    <svg className="w-10 h-10 md:w-14 md:h-14 animate-spin" style={{ animationDuration: '3s' }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke={item.color} strokeWidth="2.5" fill={`${item.color}15`}/>
                      <polyline points="12,6 12,12 16,14" stroke={item.color} strokeWidth="3"
                               className="animate-pulse"/>
                    </svg>
                  )}
                  {index === 2 && (
                    <svg className="w-10 h-10 md:w-14 md:h-14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z"
                            stroke={item.color} strokeWidth="2.5" fill={`${item.color}10`}/>
                      <circle cx="12" cy="12" r="3" stroke={item.color} strokeWidth="2.5"
                             fill={item.color} className="animate-ping"/>
                    </svg>
                  )}
                </div>
              </div>
              
              <div 
                className="performance-card-metric relative z-10"
                style={{ 
                  color: item.color,
                  filter: `drop-shadow(0 0 8px ${item.color})`
                }}
              >
                {item.metric}
              </div>
              <div 
                className={`relative z-10 ${
                  index === 0 ? 'performance-card-label-cyan' :
                  index === 1 ? 'performance-card-label-purple' :
                  'performance-card-label-pink'
                }`}
              >
                {item.label}
              </div>
              
              {/* Pulsing indicator */}
              <div 
                className="absolute -top-2 -right-2 w-3 h-3 rounded-full animate-pulse-glow"
                style={{ backgroundColor: item.color }}
              />
            </Card>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
}