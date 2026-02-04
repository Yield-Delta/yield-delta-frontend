import React from 'react';
import styles from './Text.module.css';

interface HoloTextProps {
  variant?: 'holo' | 'primary-glow' | 'secondary-glow' | 'accent-glow' | 'cyan-glow' | 'purple-glow' | 'pink-glow' | 'hero-animated' | 'hero-glow';
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  [key: string]: unknown;
}

const HoloText = ({ variant = 'holo', as = 'span', className = '', children, ...props }: HoloTextProps) => {
    const Component = as as React.ElementType;
    const getVariantClass = () => {
      switch (variant) {
        case 'primary-glow': return styles.primaryGlow;
        case 'secondary-glow': return styles.secondaryGlow;
        case 'accent-glow': return styles.accentGlow;
        case 'cyan-glow': return styles.cyanGlow;
        case 'purple-glow': return styles.purpleGlow;
        case 'pink-glow': return styles.pinkGlow;
        case 'hero-animated': return styles.heroAnimated;
        case 'hero-glow': return styles.heroGlow;
        default: return styles.holo;
      }
    };

    return React.createElement(
      Component,
      {
        className: `${getVariantClass()} ${className}`,
        ...props
      },
      children
    );
};

export default HoloText;