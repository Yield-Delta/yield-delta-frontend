'use client'

import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import { gsap } from 'gsap';
import { Menu, X, Vault, TrendingUp, Target, PieChart, RefreshCw, BookOpen, Rocket, CandlestickChart, AlertTriangle } from 'lucide-react';
import { useAccount } from 'wagmi';
import { isTestnetChain } from '@/lib/chainUtils';
import GooeyNav  from './GooeyNavigation';

// Multi-chain wallet button for Solana + SEI support
const MultiChainWalletButton = dynamic(
  () => import('./MultiChainWalletButton').then(mod => ({ default: mod.MultiChainWalletButton })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-24 h-8 bg-secondary/20 animate-pulse rounded min-w-[120px] min-h-[32px]">
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    )
  }
);

interface NavigationProps {
  variant?: 'light' | 'dark' | 'transparent';
  className?: string;
  showWallet?: boolean;
  showLaunchApp?: boolean;
}

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  desc: string;
  gradient: string;
  iconColor: string;
  borderColor: string;
}

// Memoized navigation links with Lucide icons and custom gradients
const NAV_LINKS: readonly NavLink[] = [
  {
    href: '/vaults',
    label: 'Vaults',
    icon: Vault,
    desc: 'Earn automated yield',
    gradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(6, 182, 212, 0.04) 100%)',
    iconColor: '#06b6d4',
    borderColor: 'rgba(6, 182, 212, 0.25)',
  },
  {
    href: '/market',
    label: 'Market',
    icon: TrendingUp,
    desc: 'Live price feeds',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)',
    iconColor: '#10b981',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  {
    href: '/charts',
    label: 'Charts',
    icon: CandlestickChart,
    desc: 'Technical analysis',
    gradient: 'linear-gradient(135deg, rgba(251, 146, 60, 0.12) 0%, rgba(251, 146, 60, 0.04) 100%)',
    iconColor: '#fb923c',
    borderColor: 'rgba(251, 146, 60, 0.25)',
  },
  {
    href: '/market-sentiment',
    label: 'Sentiment',
    icon: Target,
    desc: 'Market analysis',
    gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0.04) 100%)',
    iconColor: '#8b5cf6',
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  {
    href: '/dashboard',
    label: 'Portfolio',
    icon: PieChart,
    desc: 'Track your assets',
    gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0.04) 100%)',
    iconColor: '#6366f1',
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  {
    href: '/portfolio/rebalance',
    label: 'Rebalance',
    icon: RefreshCw,
    desc: 'AI optimization',
    gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(236, 72, 153, 0.04) 100%)',
    iconColor: '#ec4899',
    borderColor: 'rgba(236, 72, 153, 0.25)',
  },
  {
    href: '/docs',
    label: 'Documentation',
    icon: BookOpen,
    desc: 'Learn & explore',
    gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.04) 100%)',
    iconColor: '#f59e0b',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
] as const;

// Premium mobile menu item component - large centered box design
const MobileMenuItem = memo<{ item: NavLink; onClose: () => void }>(({ item, onClose }) => {
  const IconComponent = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className="mobile-menu-item group block w-full"
    >
      <div
        className="relative flex items-center gap-4 rounded-2xl transition-all duration-300 overflow-hidden group-active:scale-[0.98]"
        style={{
          background: item.gradient,
          border: `2px solid ${item.borderColor}`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.25), 0 0 0 1px ${item.borderColor}, inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
          willChange: 'transform, opacity',
          padding: '16px 18px',
          minHeight: '72px',
        }}
      >
        {/* Glow effect on active */}
        <div
          className="absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity duration-200 pointer-events-none rounded-2xl"
          style={{
            boxShadow: `inset 0 0 40px ${item.borderColor}, 0 0 30px ${item.borderColor}`,
          }}
          aria-hidden="true"
        />

        {/* Icon container with glow - larger */}
        <div
          className="relative flex-shrink-0 rounded-xl transition-all duration-300 group-active:scale-110"
          style={{
            background: `linear-gradient(135deg, ${item.iconColor}25 0%, ${item.iconColor}12 100%)`,
            border: `1.5px solid ${item.iconColor}50`,
            boxShadow: `0 6px 20px ${item.iconColor}30`,
            padding: '14px',
          }}
        >
          <IconComponent
            className="transition-all duration-300"
            style={{ color: item.iconColor, width: '26px', height: '26px' }}
          />
        </div>

        {/* Text content - aligned left, larger */}
        <div className="flex flex-col flex-1 relative z-10">
          <span
            className="text-white font-bold tracking-tight"
            style={{ letterSpacing: '-0.01em', fontSize: '1.125rem' }}
          >
            {item.label}
          </span>
          <span
            className="font-medium leading-tight mt-1"
            style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}
          >
            {item.desc}
          </span>
        </div>

        {/* Arrow indicator - larger */}
        <div
          className="flex-shrink-0 relative z-10 transition-transform duration-300 group-active:translate-x-1"
          style={{ color: item.iconColor, opacity: 0.8 }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>

        {/* Subtle shine effect */}
        <div
          className="absolute inset-x-0 top-0 h-px opacity-70"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${item.iconColor}60 50%, transparent 100%)`,
          }}
          aria-hidden="true"
        />
      </div>
    </Link>
  );
});

MobileMenuItem.displayName = 'MobileMenuItem';

/**
 * Render the responsive top navigation bar with brand, center navigation (GooeyNav), wallet actions, and an animated premium mobile menu.
 *
 * The component animates the logo and mobile menu using GSAP, traps focus while the mobile menu is open, and disables body scrolling during menu open. When the connected chain is a testnet, a fixed testnet banner is displayed above the nav.
 *
 * @param variant - Visual style for the nav; one of `"light" | "dark" | "transparent"`.
 * @param className - Additional CSS classes to apply to the nav container.
 * @param showWallet - If true, render the wallet connect control.
 * @param showLaunchApp - If true, show the "Launch App" button; when false the center GooeyNav and mobile menu button are shown instead.
 * @returns The navigation React element (JSX) containing branding, optional center GooeyNav, wallet/launch actions, and the full-screen animated mobile menu when opened.
 */
export function Navigation({ variant = 'transparent', className = '', showWallet = true, showLaunchApp = true }: NavigationProps) {
  const logoRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const pathname = usePathname();

  // Viewport detection to prevent hamburger rendering at 900px+
  // CRITICAL: Initialize to null to prevent hydration mismatch
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  // Check if on testnet
  const { chain } = useAccount();
  const isTestnet = chain ? isTestnetChain(chain.id) : true;

  // Viewport detection effect - runs on mount and resize
  useEffect(() => {
    // Check if viewport is 900px or wider (desktop breakpoint)
    const checkViewport = () => {
      setIsDesktop(window.innerWidth >= 900);
    };

    // IMMEDIATE check without debounce on mount
    checkViewport();

    // Add resize listener with debouncing for performance
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkViewport, 100);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const baseClasses = "fixed top-0 left-0 right-0 z-50 h-14 transition-all duration-300 m-0 p-0";

  const variantClasses = {
    light: "bg-white/95 backdrop-blur-md border-b border-gray-200",
    dark: "bg-background/95 backdrop-blur-md",
    transparent: "bg-transparent"
  };

  // GSAP Logo Animation - Professional breathe effect
  useEffect(() => {
    if (!logoRef.current) return;

    const logoElement = logoRef.current;

    // Set will-change for performance
    gsap.set(logoElement, { willChange: 'transform, filter' });

    // Subtle breathing effect - professional and calming
    const tl = gsap.timeline({ repeat: -1, yoyo: true });

    tl.to(logoElement, {
      scale: 1.05,
      filter: 'drop-shadow(0 0 12px rgba(155, 93, 229, 0.4))',
      duration: 3,
      ease: 'sine.inOut'
    });

    // Professional hover enhancement
    const hoverTl = gsap.timeline({ paused: true });
    hoverTl.to(logoElement, {
      scale: 1.1,
      filter: 'drop-shadow(0 0 20px rgba(155, 93, 229, 0.6))',
      duration: 0.3,
      ease: 'power2.out'
    });

    const handleMouseEnter = () => hoverTl.play();
    const handleMouseLeave = () => hoverTl.reverse();

    logoElement.addEventListener('mouseenter', handleMouseEnter);
    logoElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      tl.kill();
      hoverTl.kill();
      gsap.set(logoElement, { willChange: 'auto' });
      logoElement.removeEventListener('mouseenter', handleMouseEnter);
      logoElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // GSAP Mobile Menu Animation - Premium Spring Physics with Performance Optimization
  useEffect(() => {
    if (!mobileMenuRef.current) return;

    const menuElement = mobileMenuRef.current;
    const menuItems = menuElement.querySelectorAll('.mobile-menu-item');
    const backdrop = menuElement.querySelector('.mobile-menu-backdrop');
    const orbs = menuElement.querySelectorAll('.mobile-menu-orb');
    const header = menuElement.querySelector('.mobile-menu-header');
    const footer = menuElement.querySelector('.mobile-menu-footer');

    // Kill previous timeline if exists
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    if (mobileMenuOpen) {
      // Disable body scroll
      document.body.style.overflow = 'hidden';

      // Set will-change for all animated elements
      gsap.set([menuElement, backdrop, header, menuItems, footer, orbs], { willChange: 'transform, opacity, filter' });

      // Set initial states with more dramatic transforms
      gsap.set(menuElement, { opacity: 0 });
      gsap.set(backdrop, { opacity: 0, scale: 1.1 });
      gsap.set(header, { opacity: 0, y: -30, filter: 'blur(10px)' });
      gsap.set(menuItems, { opacity: 0, y: 50, scale: 0.8, filter: 'blur(8px)' });
      gsap.set(footer, { opacity: 0, y: 30, filter: 'blur(10px)' });
      gsap.set(orbs, { scale: 0, opacity: 0, filter: 'blur(20px)' });

      // Sophisticated spring-based animation
      const tl = gsap.timeline({
        onComplete: () => {
          // Remove will-change after animation completes for better performance
          gsap.set([menuElement, backdrop, header, menuItems, footer, orbs], { willChange: 'auto' });
        }
      });

      // Backdrop fade with scale
      tl.to(backdrop, {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: 'power3.out'
      }, 0)

      // Container fade
      .to(menuElement, {
        opacity: 1,
        duration: 0.4,
        ease: 'power2.out'
      }, 0)

      // Orbs with elastic spring
      .to(orbs, {
        scale: 1,
        opacity: 0.3,
        filter: 'blur(60px)',
        duration: 1.2,
        ease: 'elastic.out(1, 0.6)',
        stagger: 0.15
      }, 0.1)

      // Header with smooth blur removal
      .to(header, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.8,
        ease: 'power3.out'
      }, 0.2)

      // Menu items with sophisticated stagger
      .to(menuItems, {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        duration: 0.7,
        ease: 'power3.out',
        stagger: {
          each: 0.06,
          from: 'start',
          ease: 'power2.inOut'
        }
      }, 0.3)

      // Footer
      .to(footer, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.8,
        ease: 'power3.out'
      }, 0.5);

      timelineRef.current = tl;
    }
  }, [mobileMenuOpen]);

  // Mobile menu close handler with premium animation - memoized to prevent recreation
  const closeMobileMenu = useCallback(() => {
    if (!mobileMenuRef.current) {
      setMobileMenuOpen(false);
      document.body.style.overflow = '';
      // Return focus to hamburger button
      hamburgerButtonRef.current?.focus();
      return;
    }

    const menuElement = mobileMenuRef.current;
    const menuItems = menuElement.querySelectorAll('.mobile-menu-item');
    const backdrop = menuElement.querySelector('.mobile-menu-backdrop');
    const header = menuElement.querySelector('.mobile-menu-header');
    const footer = menuElement.querySelector('.mobile-menu-footer');

    // Set will-change for closing animation
    gsap.set([footer, menuItems, header, backdrop, menuElement], { willChange: 'transform, opacity, filter' });

    const tl = gsap.timeline({
      onComplete: () => {
        setMobileMenuOpen(false);
        document.body.style.overflow = '';
        // Return focus to hamburger button
        hamburgerButtonRef.current?.focus();
        // Remove will-change
        gsap.set([footer, menuItems, header, backdrop, menuElement], { willChange: 'auto' });
      }
    });

    // Smooth exit with blur and scale
    tl.to(footer, {
      opacity: 0,
      y: 20,
      filter: 'blur(8px)',
      duration: 0.3,
      ease: 'power2.in'
    }, 0)
    .to(menuItems, {
      opacity: 0,
      y: -30,
      scale: 0.85,
      filter: 'blur(8px)',
      duration: 0.4,
      ease: 'power2.in',
      stagger: {
        each: 0.04,
        from: 'end'
      }
    }, 0.05)
    .to(header, {
      opacity: 0,
      y: -20,
      filter: 'blur(8px)',
      duration: 0.3,
      ease: 'power2.in'
    }, 0.1)
    .to(backdrop, {
      opacity: 0,
      scale: 1.05,
      duration: 0.4,
      ease: 'power2.in'
    }, 0.15)
    .to(menuElement, {
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in'
    }, 0.2);
  }, []);

  // Focus trap for accessibility
  useEffect(() => {
    if (!mobileMenuOpen || !mobileMenuRef.current) return;

    const menuElement = mobileMenuRef.current;
    const focusableElements = menuElement.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus the close button when menu opens
    const focusTimer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 100);

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMobileMenu();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [mobileMenuOpen, closeMobileMenu]);

  // Toggle menu handler - memoized
  const toggleMobileMenu = useCallback(() => {
    if (mobileMenuOpen) {
      closeMobileMenu();
    } else {
      setMobileMenuOpen(true);
    }
  }, [mobileMenuOpen, closeMobileMenu]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
      // Ensure body scroll is restored
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <>
      {/* Testnet Banner - Integrated with Navigation */}
      {isTestnet && (
        <div
          className="fixed top-0 left-0 right-0 z-[100000] bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 h-8 flex items-center justify-center border-b border-orange-600/20"
          style={{
            boxShadow: '0 2px 10px rgba(251, 146, 60, 0.3)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <div className="flex items-center gap-2 text-white">
            <AlertTriangle className="h-4 w-4 animate-pulse" />
            <span className="font-bold text-sm tracking-wide">TESTNET MODE</span>
            <span className="text-white/80 mx-1">|</span>
            <span className="text-white/90 text-xs">SEI Atlantic-2</span>
            <span className="text-white/80 mx-1">•</span>
            <span className="text-white/90 text-xs font-medium">Test Tokens Only</span>
          </div>
        </div>
      )}

      <nav
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        style={{
          position: 'fixed',
          height: '3.5rem',
          isolation: 'isolate',
          zIndex: 99999,
          top: isTestnet ? '2rem' : '0'
        }}
        role="navigation"
        aria-label="Main navigation"
      >
      <div className="simple-nav-container">
        {/* LEFT SIDE */}
        <div className="nav-left-simple">
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <div
              ref={logoRef}
              className="logo-animation-gsap"
              style={{
                transformStyle: 'preserve-3d',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Logo
                variant="horizontal-svg"
                size={48}
                animated={false}
                className="nav-logo-desktop"
              />
              <Logo
                variant="icon"
                size={48}
                animated={false}
                className="nav-logo-mobile"
              />
            </div>
          </Link>
          <div className="nav-brand nav-brand-tablet">
            <div
              className="font-bold gradient-text"
              style={{
                fontSize: '2rem',
                lineHeight: '1.2',
                fontWeight: '800'
              }}
            >
              Yield Delta
            </div>
          </div>
        </div>

        {/* CENTER - Gooey Navigation (only show when inside app, hidden on mobile via CSS) */}
        {!showLaunchApp && (
          <div className="nav-center-links">
            <GooeyNav
              items={NAV_LINKS.map(link => ({
                label: link.label,
                href: link.href
              }))}
              particleCount={15}
              particleDistances={[90, 10]}
              particleR={100}
              initialActiveIndex={NAV_LINKS.findIndex(link => link.href === pathname) >= 0 ? NAV_LINKS.findIndex(link => link.href === pathname) : 0}
              animationTime={600}
              timeVariance={300}
              colors={[1, 2, 3, 1, 2, 3, 1, 4]}
            />

          </div>
        )}

        {/* RIGHT SIDE */}
        <div className="nav-right-simple">
          {showLaunchApp && (
            <Link
              href="/vaults"
              className="btn-cyber"
            >
              <span>Launch App</span>
            </Link>
          )}

          {/* Multi-Chain Wallet Connect - Always visible */}
          {showWallet && (
            <div className="wallet-container">
              <MultiChainWalletButton />
            </div>
          )}

          {/* Mobile Menu Button (hamburger - HIDDEN at 900px+ via React AND CSS) */}
          {/* CRITICAL: Only render if NOT desktop (isDesktop === false) AND not on launch page */}
          {/* CSS provides additional defense-in-depth hiding at 900px+ */}
          {!showLaunchApp && isDesktop === false && (
            <button
              ref={hamburgerButtonRef}
              onClick={toggleMobileMenu}
              className="mobile-menu-btn"
              aria-label={mobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              data-mobile-only="true"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Premium Full-Screen Mobile Menu Overlay */}
      {!showLaunchApp && mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          id="mobile-menu"
          className="fixed inset-0 z-[99999]"
          style={{
            width: '100vw',
            height: '100vh',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-menu-title"
        >
          {/* Premium backdrop with advanced blur - fully opaque to hide content behind */}
          <div
            className="absolute inset-0 mobile-menu-backdrop"
            onClick={closeMobileMenu}
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(180deg, rgb(10, 10, 18) 0%, rgb(13, 17, 23) 50%, rgb(10, 10, 18) 100%)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            }}
            aria-hidden="true"
          />

          {/* Premium mesh gradient overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(circle at 20% 20%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)
              `,
              mixBlendMode: 'screen',
              animation: 'premiumMeshMove 20s ease-in-out infinite',
            }}
            aria-hidden="true"
          />

          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)
              `,
              backgroundSize: '80px 80px',
            }}
            aria-hidden="true"
          />

          {/* Premium floating orbs with enhanced blur */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            <div
              className="absolute mobile-menu-orb"
              style={{
                width: '400px',
                height: '400px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, rgba(6, 182, 212, 0.1) 40%, transparent 70%)',
                top: '5%',
                left: '-10%',
                filter: 'blur(80px)',
                animation: 'floatOrbPremium 10s ease-in-out infinite',
              }}
            />
            <div
              className="absolute mobile-menu-orb"
              style={{
                width: '350px',
                height: '350px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, rgba(139, 92, 246, 0.1) 40%, transparent 70%)',
                bottom: '10%',
                right: '-10%',
                filter: 'blur(70px)',
                animation: 'floatOrbPremium 12s ease-in-out infinite reverse',
              }}
            />
            <div
              className="absolute mobile-menu-orb"
              style={{
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, rgba(99, 102, 241, 0.08) 40%, transparent 70%)',
                top: '50%',
                right: '15%',
                filter: 'blur(60px)',
                animation: 'floatOrbPremium 14s ease-in-out infinite',
                animationDelay: '-4s',
              }}
            />
          </div>

          {/* Noise texture overlay for depth */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.015]"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
              mixBlendMode: 'overlay',
            }}
            aria-hidden="true"
          />

          {/* Close button - Premium design */}
          <button
            ref={closeButtonRef}
            onClick={closeMobileMenu}
            className="absolute top-6 right-6 z-10 p-3 rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              willChange: 'transform'
            }}
            aria-label="Close menu"
          >
            <X className="w-6 h-6 text-white/90" aria-hidden="true" />
          </button>

          {/* Menu Content - Premium Layout */}
          <div
            className="relative z-10 flex flex-col h-full px-5 safe-area-inset"
            style={{ paddingTop: '60px', paddingBottom: '20px' }}
            onClick={(e) => {
              // Close menu when clicking on empty space (not on links/buttons)
              if (e.target === e.currentTarget) {
                closeMobileMenu();
              }
            }}
          >
            {/* Header Section - Compact */}
            <div
              className="mobile-menu-header flex-shrink-0 pb-5"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeMobileMenu();
              }}
            >
              <h2
                id="mobile-menu-title"
                className="text-3xl font-bold text-center mb-2"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #6366f1 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.02em',
                }}
              >
                Yield Delta
              </h2>
              <p className="text-gray-400 text-sm text-center font-medium tracking-wide">
                DeFi Yield Optimization
              </p>
            </div>

            {/* Main Menu Items - Scrollable list that fills available space */}
            <nav
              className="flex-1 flex flex-col items-center overflow-y-auto py-2"
              aria-label="Mobile menu navigation"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeMobileMenu();
              }}
            >
              <div className="flex flex-col gap-3 w-full max-w-md px-1">
                {NAV_LINKS.map((item) => (
                  <MobileMenuItem key={item.href} item={item} onClose={closeMobileMenu} />
                ))}
              </div>
            </nav>

            {/* Footer Section - Premium CTA */}
            <div
              className="mobile-menu-footer flex-shrink-0 pt-4 pb-6 space-y-3"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeMobileMenu();
              }}
            >
              {/* Deploy CTA - Premium gradient button */}
              <Link
                href="/vaults/deploy"
                onClick={closeMobileMenu}
                className="mobile-menu-item block w-full max-w-md mx-auto group"
              >
                <div
                  className="relative flex items-center justify-center gap-4 p-4 rounded-2xl transition-all duration-300 overflow-hidden group-active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.18) 0%, rgba(139, 92, 246, 0.18) 50%, rgba(99, 102, 241, 0.18) 100%)',
                    border: '1px solid rgba(6, 182, 212, 0.35)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(6, 182, 212, 0.2), 0 0 0 1px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {/* Animated glow overlay */}
                  <div
                    className="absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity duration-200 rounded-2xl"
                    style={{
                      boxShadow: 'inset 0 0 40px rgba(6, 182, 212, 0.3), 0 0 30px rgba(139, 92, 246, 0.25)',
                    }}
                    aria-hidden="true"
                  />

                  {/* Icon container */}
                  <div
                    className="relative p-2.5 rounded-xl transition-all duration-300 group-active:scale-110"
                    style={{
                      background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      boxShadow: '0 4px 16px rgba(6, 182, 212, 0.2)',
                    }}
                  >
                    <Rocket className="w-5 h-5" style={{ color: '#06b6d4' }} />
                  </div>

                  <div className="flex flex-col relative z-10">
                    <span
                      className="font-bold text-base tracking-tight"
                      style={{
                        background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #6366f1 100%)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      Deploy Your Vault
                    </span>
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: 'rgba(255, 255, 255, 0.45)' }}
                    >
                      Launch a custom strategy
                    </span>
                  </div>

                  {/* Arrow indicator */}
                  <div
                    className="ml-auto relative z-10 transition-transform duration-300 group-active:translate-x-1"
                    style={{ color: 'rgba(6, 182, 212, 0.6)' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>

                  {/* Top shine */}
                  <div
                    className="absolute inset-x-0 top-0 h-px opacity-60"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(6, 182, 212, 0.5) 30%, rgba(139, 92, 246, 0.5) 70%, transparent 100%)',
                    }}
                    aria-hidden="true"
                  />
                </div>
              </Link>

              {/* Close hint */}
              <p className="text-gray-500 text-xs text-center font-medium">
                Tap anywhere to close or press ESC
              </p>
            </div>
          </div>
        </div>
      )}
      </nav>
    </>
  );
}

export default Navigation;