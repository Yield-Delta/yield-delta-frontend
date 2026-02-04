import { forwardRef } from 'react';
import styles from './GlassCard.module.css';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  children: React.ReactNode;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ hover = false, className = '', children, ...props }, ref) => {
    const cardClass = hover 
      ? `${styles.glassCard} ${styles.glassCardHover}` 
      : styles.glassCard;

    return (
      <div
        ref={ref}
        className={`${cardClass} ${className}`}
        {...props}
      >
        <div className={styles.glassCardContent}>
          {children}
        </div>
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export default GlassCard;