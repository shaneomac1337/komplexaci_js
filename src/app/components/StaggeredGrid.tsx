'use client';

import { ReactNode, Children, cloneElement, isValidElement } from 'react';
import useIntersectionObserver from '../hooks/useIntersectionObserver';

interface StaggeredGridProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  animation?: 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn';
  threshold?: number;
  rootMargin?: string;
}

const StaggeredGrid: React.FC<StaggeredGridProps> = ({
  children,
  className = '',
  staggerDelay = 0.1,
  animation = 'fadeInUp',
  threshold = 0.1,
  rootMargin = '0px',
}) => {
  const { elementRef, hasIntersected } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce: true,
  });

  const getAnimationClasses = (index: number, isVisible: boolean) => {
    const delay = index * staggerDelay;
    const baseClasses = 'transition-all duration-700 ease-out';
    const delayClass = `delay-[${Math.round(delay * 1000)}ms]`;

    if (!isVisible) {
      switch (animation) {
        case 'fadeInUp':
          return `${baseClasses} ${delayClass} opacity-0 translate-y-8`;
        case 'fadeInLeft':
          return `${baseClasses} ${delayClass} opacity-0 -translate-x-8`;
        case 'fadeInRight':
          return `${baseClasses} ${delayClass} opacity-0 translate-x-8`;
        case 'scaleIn':
          return `${baseClasses} ${delayClass} opacity-0 scale-95`;
        default:
          return `${baseClasses} ${delayClass} opacity-0 translate-y-8`;
      }
    }

    return `${baseClasses} ${delayClass} opacity-100 translate-y-0 translate-x-0 scale-100`;
  };

  const childrenArray = Children.toArray(children);

  return (
    <div ref={elementRef as React.RefObject<HTMLDivElement>} className={className}>
      {childrenArray.map((child, index) => {
        if (isValidElement(child)) {
          const existingClassName = (child.props as { className?: string }).className || '';
          const newClassName = `${existingClassName} ${getAnimationClasses(index, hasIntersected)}`;

          return cloneElement(child as React.ReactElement<{ className?: string }>, {
            key: child.key || index,
            className: newClassName,
          });
        }
        return child;
      })}
    </div>
  );
};

export default StaggeredGrid;
