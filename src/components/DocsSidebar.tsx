'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Menu, X } from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    title: 'Introduction',
    href: '/docs',
  },
  {
    title: 'Getting Started',
    href: '/docs/getting-started',
  },
  {
    title: 'Core Features',
    href: '/docs/features',
    children: [
      {
        title: 'Vaults',
        href: '/docs/features/vaults',
      },
      {
        title: 'AI Rebalancing',
        href: '/docs/features/ai-rebalancing',
      },
    ],
  },
  {
    title: 'AI Engine',
    href: '/docs/ai-engine',
  },
  {
    title: 'Smart Contracts',
    href: '/docs/smart-contracts',
  },
  {
    title: 'API Reference',
    href: '/docs/api-reference',
  },
  {
    title: 'Deployment',
    href: '/docs/deployment',
  },
  {
    title: 'Troubleshooting',
    href: '/docs/troubleshooting',
  },
];

interface DocsSidebarProps {
  className?: string;
  onMobileToggle?: (isOpen: boolean) => void;
}

export default function DocsSidebar({ className = '', onMobileToggle }: DocsSidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Close mobile sidebar when pathname changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Handle escape key to close mobile sidebar
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileOpen]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  // Close mobile sidebar when window resizes to desktop size (≥1024px)
  // Responsive strategy: Mobile (≤640px), Tablet Portrait (641px-768px), 
  // Tablet Landscape (769px-1023px) all use hamburger menu
  // Desktop (≥1024px) shows sidebar by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileOpen]);

  // Notify parent component of mobile toggle state
  useEffect(() => {
    onMobileToggle?.(isMobileOpen);
  }, [isMobileOpen, onMobileToggle]);

  const toggleExpanded = useCallback((href: string) => {
    setExpandedItems(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(href)) {
        newExpanded.delete(href);
      } else {
        newExpanded.add(href);
      }
      return newExpanded;
    });
  }, []);

  const isActive = useCallback((href: string) => {
    if (href === '/docs') {
      return pathname === '/docs';
    }
    return pathname.startsWith(href);
  }, [pathname]);

  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.href);
    const active = isActive(item.href);

    return (
      <div key={item.href}>
        <div className="flex items-center">
          <Link
            href={item.href}
            className={`flex-1 block px-3 py-3 sm:py-2 text-sm rounded-md transition-colors touch-manipulation ${
              active
                ? 'docs-nav-active bg-primary/10 text-primary font-medium border border-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted/70'
            } ${depth > 0 ? 'ml-4' : ''}`}
            onClick={() => {
              setIsMobileOpen(false);
            }}
          >
            {item.title}
          </Link>
          {hasChildren && (
            <button
              onClick={() => toggleExpanded(item.href)}
              className="p-2 sm:p-1 text-muted-foreground hover:text-foreground transition-colors touch-manipulation active:bg-muted/50 rounded"
              aria-label={isExpanded ? `Collapse ${item.title} section` : `Expand ${item.title} section`}
            >
              <ChevronRight
                className={`h-5 w-5 sm:h-4 sm:w-4 transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`}
              />
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {item.children!.map((child) => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile/Tablet toggle button - visible on all screens < 1024px */}
      {/* Enhanced touch interaction for tablets */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 sm:p-2 bg-background/80 backdrop-blur-sm border border-border rounded-md shadow-lg transition-all duration-200 hover:bg-background hover:shadow-xl active:scale-95"
        aria-label={isMobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isMobileOpen}
      >
        {isMobileOpen ? (
          <X className="h-6 w-6 sm:h-5 sm:w-5 text-foreground" />
        ) : (
          <Menu className="h-6 w-6 sm:h-5 sm:w-5 text-foreground" />
        )}
      </button>

      {/* Mobile/Tablet overlay - hidden on desktop (≥1024px) */}
      {/* Enhanced overlay with better touch interaction */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-200 cursor-pointer"
          onClick={() => setIsMobileOpen(false)}
          onTouchStart={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Responsive Sidebar */}
      {/* Mobile (≤640px): Hidden by default, hamburger menu */}
      {/* Tablet Portrait (641px-768px): Hidden by default, hamburger menu */}
      {/* Tablet Landscape (769px-1023px): Hidden by default, hamburger menu */}
      {/* Desktop (≥1024px): Visible by default, no hamburger menu */}
      <nav
        className={`
          docs-sidebar
          fixed lg:static top-0 left-0 z-40 h-screen lg:h-auto
          w-72 sm:w-64 bg-background border-r border-border
          transition-transform duration-200 ease-in-out
          overflow-y-auto lg:overflow-visible
          shadow-lg lg:shadow-none
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${className}
        `}
        role="navigation"
        aria-label="Documentation navigation"
      >
        <div className="p-6 sm:p-6">
          <div className="mb-8 pb-4 border-b border-border/50">
            <Link 
              href="/docs" 
              className="text-xl font-bold text-foreground hover:text-primary transition-colors block py-1"
              onClick={() => setIsMobileOpen(false)}
            >
              Documentation
            </Link>
            <p className="text-sm text-muted-foreground mt-1">
              Complete guide to Yield Delta
            </p>
          </div>
          <div className="space-y-2">
            {navigation.map((item) => renderNavItem(item))}
          </div>
        </div>
      </nav>
    </>
  );
}