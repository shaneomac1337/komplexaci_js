'use client';

import { ReactNode } from 'react';
import useIntersectionObserver from '../hooks/useIntersectionObserver';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  animation?: 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'fadeIn' | 'scaleIn' | 'slideInUp';
  delay?: number;
  duration?: number;
  threshold?: number;
  rootMargin?: string;
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  className = '',
  animation = 'fadeInUp',
  delay = 0,
  duration = 0.8,
  threshold = 0.1,
  rootMargin = '0px',
}) => {
  const { elementRef, hasIntersected } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce: true,
  });

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all ease-out';
    const durationClass = `duration-[${Math.round(duration * 1000)}ms]`;
    const delayClass = delay > 0 ? `delay-[${Math.round(delay * 1000)}ms]` : '';

    if (!hasIntersected) {
      switch (animation) {
        case 'fadeInUp':
          return `${baseClasses} ${durationClass} ${delayClass} opacity-0 translate-y-8`;
        case 'fadeInLeft':
          return `${baseClasses} ${durationClass} ${delayClass} opacity-0 -translate-x-8`;
        case 'fadeInRight':
          return `${baseClasses} ${durationClass} ${delayClass} opacity-0 translate-x-8`;
        case 'fadeIn':
          return `${baseClasses} ${durationClass} ${delayClass} opacity-0`;
        case 'scaleIn':
          return `${baseClasses} ${durationClass} ${delayClass} opacity-0 scale-95`;
        case 'slideInUp':
          return `${baseClasses} ${durationClass} ${delayClass} opacity-0 translate-y-12`;
        default:
          return `${baseClasses} ${durationClass} ${delayClass} opacity-0 translate-y-8`;
      }
    }

    return `${baseClasses} ${durationClass} ${delayClass} opacity-100 translate-y-0 translate-x-0 scale-100`;
  };

  return (
    <div
      ref={elementRef as React.RefObject<HTMLDivElement>}
      className={`${getAnimationClasses()} ${className}`}
    >
      {children}
    </div>
  );
};

export default AnimatedSection;
