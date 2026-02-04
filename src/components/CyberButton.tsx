import { forwardRef } from 'react';
import styles from './Button.module.css';

interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'compact' | 'large';
  children: React.ReactNode;
}

const CyberButton = forwardRef<HTMLButtonElement, CyberButtonProps>(
  ({ variant = 'default', className = '', children, ...props }, ref) => {
    const getVariantClass = () => {
      switch (variant) {
        case 'compact': return styles.cyberCompact;
        case 'large': return styles.cyberLarge;
        default: return styles.cyber;
      }
    };

    return (
      <button
        ref={ref}
        className={`${getVariantClass()} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

CyberButton.displayName = 'CyberButton';

export default CyberButton;