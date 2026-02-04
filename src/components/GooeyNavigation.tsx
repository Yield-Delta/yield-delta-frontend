import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import './GooeyNav.css';

interface GooeyNavItem {
  label: string;
  href: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export interface GooeyNavProps {
  items: GooeyNavItem[];
  animationTime?: number;
  particleCount?: number;
  particleDistances?: [number, number];
  particleR?: number;
  timeVariance?: number;
  colors?: number[];
  initialActiveIndex?: number;
  preventNavigation?: boolean;
  onItemChange?: (index: number, item: GooeyNavItem) => void;
}

interface Particle {
  start: [number, number];
  end: [number, number];
  time: number;
  scale: number;
  color: number;
  rotate: number;
}

const GooeyNav: React.FC<GooeyNavProps> = ({
  items,
  animationTime = 600,
  particleCount = 15,
  particleDistances = [90, 10],
  particleR = 100,
  timeVariance = 300,
  colors = [1, 2, 3, 1, 2, 3, 1, 4],
  initialActiveIndex = 0,
  preventNavigation = false,
  onItemChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLUListElement>(null);
  const filterRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const animationFrameRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(initialActiveIndex);

  // Memoize utility functions
  const noise = useCallback((n = 1) => n / 2 - Math.random() * n, []);

  const getXY = useCallback(
    (distance: number, pointIndex: number, totalPoints: number): [number, number] => {
      const angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
      return [distance * Math.cos(angle), distance * Math.sin(angle)];
    },
    [noise]
  );

  const createParticle = useCallback(
    (i: number, t: number, d: [number, number], r: number): Particle => {
      if (colors.length === 0) {
        console.warn('colors array is empty, using default color');
      }
      const rotate = noise(r / 10);
      return {
        start: getXY(d[0], particleCount - i, particleCount),
        end: getXY(d[1] + noise(7), particleCount - i, particleCount),
        time: t,
        scale: 1 + noise(0.2),
        color: colors.length > 0 ? colors[Math.floor(Math.random() * colors.length)] : 1,
        rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10
      };
    },
    [noise, getXY, particleCount, colors]
  );

  // Clear timeouts and animation frames on unmount
  useEffect(() => {
    const timeouts = timeoutsRef.current;
    const animationFrame = animationFrameRef.current;

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      timeouts.clear();
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  const makeParticles = useCallback(
    (element: HTMLElement) => {
      const d: [number, number] = particleDistances;
      const r = particleR;
      const bubbleTime = animationTime * 2 + timeVariance;
      element.style.setProperty('--time', `${bubbleTime}ms`);

      // Clear any existing particles
      const existingParticles = element.querySelectorAll('.particle');
      existingParticles.forEach(p => {
        try {
          element.removeChild(p);
        } catch {
          // Particle may have been already removed
        }
      });

      element.classList.remove('active');

      // Batch DOM operations
      const fragment = document.createDocumentFragment();
      const particles: { element: HTMLElement; delay: number; duration: number }[] = [];

      for (let i = 0; i < particleCount; i++) {
        const t = animationTime * 2 + noise(timeVariance * 2);
        const p = createParticle(i, t, d, r);

        const particle = document.createElement('span');
        const point = document.createElement('span');
        particle.classList.add('particle');
        particle.style.setProperty('--start-x', `${p.start[0]}px`);
        particle.style.setProperty('--start-y', `${p.start[1]}px`);
        particle.style.setProperty('--end-x', `${p.end[0]}px`);
        particle.style.setProperty('--end-y', `${p.end[1]}px`);
        particle.style.setProperty('--time', `${p.time}ms`);
        particle.style.setProperty('--scale', `${p.scale}`);
        particle.style.setProperty('--color', `var(--color-${p.color}, white)`);
        particle.style.setProperty('--rotate', `${p.rotate}deg`);

        point.classList.add('point');
        particle.appendChild(point);

        particles.push({ element: particle, delay: 30, duration: t });
      }

      // Add particles with staggered animation
      const startTimeout = setTimeout(() => {
        particles.forEach(({ element, duration }) => {
          fragment.appendChild(element);

          const endTimeout = setTimeout(() => {
            try {
              if (element && element.parentNode) {
                element.parentNode.removeChild(element);
              }
            } catch {
              // Element may have been removed
            }
            timeoutsRef.current.delete(endTimeout);
          }, duration);

          timeoutsRef.current.add(endTimeout);
        });

        if (element && element.parentNode) {
          element.appendChild(fragment);

          animationFrameRef.current = requestAnimationFrame(() => {
            if (element && element.classList) {
              element.classList.add('active');
            }
            animationFrameRef.current = null;
          });
        }

        timeoutsRef.current.delete(startTimeout);
      }, 30);

      timeoutsRef.current.add(startTimeout);
    },
    [animationTime, particleCount, particleDistances, particleR, timeVariance, noise, createParticle]
  );

  const updateEffectPosition = useCallback((element: HTMLElement) => {
    if (!containerRef.current || !filterRef.current || !textRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const pos = element.getBoundingClientRect();

    const styles = {
      left: `${pos.x - containerRect.x}px`,
      top: `${pos.y - containerRect.y}px`,
      width: `${pos.width}px`,
      height: `${pos.height}px`
    };

    Object.assign(filterRef.current.style, styles);
    Object.assign(textRef.current.style, styles);
    textRef.current.innerText = element.innerText;
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, index: number) => {
      // Prevent default navigation if configured
      if (preventNavigation) {
        e.preventDefault();
      }

      // Get the parent li element for positioning
      const liElement = e.currentTarget.closest('li') as HTMLLIElement;
      if (!liElement) return;

      // Validate item exists
      const item = items[index];
      if (!item) return;

      // Call custom onClick handler if provided
      item.onClick?.(e);

      // Don't update if same index
      if (activeIndex === index) return;

      setActiveIndex(index);
      updateEffectPosition(liElement);

      // Clear existing particles
      if (filterRef.current) {
        const particles = filterRef.current.querySelectorAll('.particle');
        particles.forEach(p => {
          try {
            filterRef.current!.removeChild(p);
          } catch {
            // Particle already removed
          }
        });
      }

      // Animate text change
      if (textRef.current) {
        textRef.current.classList.remove('active');
        // Force reflow
        void textRef.current.offsetWidth;
        textRef.current.classList.add('active');
      }

      // Create new particles
      if (filterRef.current) {
        makeParticles(filterRef.current);
      }

      // Call change handler
      if (onItemChange) {
        onItemChange(index, item);
      }
    },
    [activeIndex, items, preventNavigation, onItemChange, updateEffectPosition, makeParticles]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLAnchorElement>) => {
      const currentIndex = Number(e.currentTarget.dataset.index ?? 0);
      if (isNaN(currentIndex)) {
        console.warn('Invalid index in keyboard navigation');
        return;
      }

      switch (e.key) {
        case 'Enter':
        case ' ': {
          e.preventDefault();
          // Trigger a programmatic click instead of casting event types
          const currentElement = e.currentTarget;
          currentElement.click();
          break;
        }
        case 'ArrowRight':
        case 'ArrowDown': {
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % items.length;
          const nextElement = navRef.current?.querySelectorAll('a')[nextIndex] as HTMLAnchorElement;
          nextElement?.focus();
          nextElement?.click();
          break;
        }
        case 'ArrowLeft':
        case 'ArrowUp': {
          e.preventDefault();
          const prevIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
          const prevElement = navRef.current?.querySelectorAll('a')[prevIndex] as HTMLAnchorElement;
          prevElement?.focus();
          prevElement?.click();
          break;
        }
        case 'Home': {
          e.preventDefault();
          const firstElement = navRef.current?.querySelector('a') as HTMLAnchorElement;
          firstElement?.focus();
          firstElement?.click();
          break;
        }
        case 'End': {
          e.preventDefault();
          const lastElement = navRef.current?.querySelectorAll('a')[items.length - 1] as HTMLAnchorElement;
          lastElement?.focus();
          lastElement?.click();
          break;
        }
      }
    },
    [items.length]
  );

  // Initial setup and resize observer
  useEffect(() => {
    if (!navRef.current || !containerRef.current) return;

    const activeLi = navRef.current.querySelectorAll('li')[activeIndex] as HTMLElement;
    if (activeLi) {
      updateEffectPosition(activeLi);
      if (textRef.current) {
        textRef.current.classList.add('active');
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      const currentActiveLi = navRef.current?.querySelectorAll('li')[activeIndex] as HTMLElement;
      if (currentActiveLi) {
        updateEffectPosition(currentActiveLi);
      }
    });

    resizeObserver.observe(containerRef.current);

    // Also observe all nav items for size changes
    const navItems = navRef.current.querySelectorAll('li');
    navItems.forEach(item => resizeObserver.observe(item));

    return () => {
      resizeObserver.disconnect();
    };
  }, [activeIndex, updateEffectPosition]);

  // Update active state when items change
  useEffect(() => {
    if (activeIndex >= items.length) {
      setActiveIndex(0);
    }
  }, [items.length, activeIndex]);

  // Memoize items rendering
  const navItems = useMemo(
    () =>
      items.map((item, index) => (
        <li
          key={`${item.href}-${index}`}
          className={activeIndex === index ? 'active' : ''}
        >
          <a
            href={item.href}
            onClick={e => handleClick(e, index)}
            onKeyDown={handleKeyDown}
            data-index={index}
            aria-current={activeIndex === index ? 'page' : undefined}
            tabIndex={0}
            role="menuitem"
          >
            {item.label}
          </a>
        </li>
      )),
    [items, activeIndex, handleClick, handleKeyDown]
  );

  return (
    <div className="gooey-nav-container" ref={containerRef} role="navigation">
      <nav aria-label="Main navigation">
        <ul ref={navRef} role="menubar">
          {navItems}
        </ul>
      </nav>
      <span className="effect filter" ref={filterRef} aria-hidden="true" />
      <span className="effect text" ref={textRef} aria-hidden="true" />
    </div>
  );
};

export default GooeyNav;