'use client';

import { ReactNode, Children, cloneElement, isValidElement } from 'react';
import useIntersectionObserver from '../hooks/useIntersectionObserver';
import { getOptimalGridLayout, GridConfig } from '../utils/gridOptimizer';

interface OptimizedGridProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  animation?: 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn';
  threshold?: number;
  rootMargin?: string;
  itemCount?: number; // Optional override for item count
  maxWidth?: string; // Optional max width constraint
  gapSize?: 'sm' | 'md' | 'lg'; // Gap size between items
  centerSingle?: boolean; // Center single items
  centerDouble?: boolean; // Center double items
  showAnalysis?: boolean; // Show layout analysis in console (dev mode)
}



const OptimizedGrid: React.FC<OptimizedGridProps> = ({
  children,
  className = '',
  staggerDelay = 0.1,
  animation = 'fadeInUp',
  threshold = 0.1,
  rootMargin = '0px',
  itemCount,
  maxWidth,
  gapSize = 'md',
  centerSingle = true,
  centerDouble = true,
  showAnalysis = false,
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
  const actualItemCount = itemCount || childrenArray.length;

  // Get optimal grid layout using the utility
  const gridConfig: GridConfig = {
    itemCount: actualItemCount,
    maxWidth,
    gapSize,
    centerSingle,
    centerDouble
  };

  const gridLayout = getOptimalGridLayout(gridConfig);
  const finalClassName = className ? `${gridLayout.className} ${className}` : gridLayout.className;

  // Development mode analysis
  if (showAnalysis && process.env.NODE_ENV === 'development') {
    console.log(`Grid Analysis for ${actualItemCount} items:`, {
      layout: gridLayout,
      breakpoints: gridLayout.breakpoints,
      description: gridLayout.description
    });
  }

  return (
    <div ref={elementRef as React.RefObject<HTMLDivElement>} className={finalClassName}>
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

export default OptimizedGrid;
