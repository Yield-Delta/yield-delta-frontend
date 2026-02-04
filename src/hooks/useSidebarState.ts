import { useState, useEffect, useCallback } from 'react';

export interface SidebarState {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

export function useSidebarState(initialState = false): SidebarState {
  const [isOpen, setIsOpen] = useState(initialState);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Close sidebar when window is resized to desktop size
  // Enhanced responsive strategy: Close sidebar for all screen sizes < 1024px
  // Desktop (≥1024px) shows sidebar by default, mobile/tablet use hamburger
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  return {
    isOpen,
    toggle,
    open,
    close,
  };
}