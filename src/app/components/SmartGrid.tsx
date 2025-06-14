'use client';

import { ReactNode, Children, cloneElement, isValidElement } from 'react';
import useIntersectionObserver from '../hooks/useIntersectionObserver';

interface SmartGridProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  animation?: 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn';
  threshold?: number;
  rootMargin?: string;
  maxColumns?: number; // Maximum columns per row (default: 3)
  gapSize?: 'sm' | 'md' | 'lg';
}

const SmartGrid: React.FC<SmartGridProps> = ({
  children,
  className = '',
  staggerDelay = 0.1,
  animation = 'fadeInUp',
  threshold = 0.1,
  rootMargin = '0px',
  maxColumns = 3,
  gapSize = 'md',
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
  const itemCount = childrenArray.length;

  // Gap size mapping
  const gaps = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  };

  const gap = gaps[gapSize];

  // Calculate grid layout
  const getGridClasses = () => {
    if (itemCount === 1) {
      return 'grid grid-cols-1 max-w-md mx-auto';
    }
    if (itemCount === 2) {
      return 'grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto';
    }
    
    // For 3+ items, use responsive grid with max 3 columns
    return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  };

  // Group items into rows for smart centering
  const groupItemsIntoRows = () => {
    const rows: ReactNode[][] = [];
    const desktopColumns = Math.min(maxColumns, 3); // Ensure max 3 columns
    
    for (let i = 0; i < childrenArray.length; i += desktopColumns) {
      rows.push(childrenArray.slice(i, i + desktopColumns));
    }
    
    return rows;
  };

  const rows = groupItemsIntoRows();
  const lastRow = rows[rows.length - 1];
  const lastRowItemCount = lastRow?.length || 0;
  const isIncompleteLastRow = lastRowItemCount > 0 && lastRowItemCount < maxColumns && rows.length > 1;

  return (
    <div ref={elementRef as React.RefObject<HTMLDivElement>} className={`${gap} mt-8 ${className}`}>
      {rows.map((row, rowIndex) => {
        const isLastRow = rowIndex === rows.length - 1;
        const shouldCenterRow = isLastRow && isIncompleteLastRow;
        
        // Determine grid classes for this row
        let rowGridClasses = '';
        const shouldCenterTwoItems = row.length === 2 && (shouldCenterRow || itemCount === 2);
        
        if (row.length === 1) {
          rowGridClasses = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
        } else if (row.length === 2) {
          // For 2 items, always use grid but center them
          rowGridClasses = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
        } else {
          rowGridClasses = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
        }

        const rowContent = (
          <div className={`${rowGridClasses} ${gap}`}>
            {row.map((child, childIndex) => {
              const globalIndex = rowIndex * maxColumns + childIndex;
              
              if (isValidElement(child)) {
                const existingClassName = (child.props as { className?: string }).className || '';
                let newClassName = `${existingClassName} ${getAnimationClasses(globalIndex, hasIntersected)}`;
                
                // Add centering classes for different scenarios
                if (shouldCenterTwoItems) {
                  // For 2 items, place them in columns 1 and 2
                  if (childIndex === 0) {
                    newClassName += ' lg:col-start-1';
                  } else if (childIndex === 1) {
                    newClassName += ' lg:col-start-2';
                  }
                } else if (shouldCenterRow && row.length === 2) {
                  // For 2 items in incomplete last row, spread them out
                  if (childIndex === 0) {
                    newClassName += ' lg:col-start-1';
                  } else if (childIndex === 1) {
                    newClassName += ' lg:col-start-3';
                  }
                } else if (shouldCenterRow && row.length === 1) {
                  // For 1 item in 3-column grid
                  newClassName += ' lg:col-start-2';
                }

                return cloneElement(child as React.ReactElement<{ className?: string }>, {
                  key: child.key || globalIndex,
                  className: newClassName,
                });
              }
              return child;
            })}
          </div>
        );

        // Wrap 2-item rows in a centering container
        if (shouldCenterTwoItems) {
          return (
            <div key={rowIndex} className={`flex justify-center ${rowIndex > 0 ? 'mt-6' : ''}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                {row.map((child, childIndex) => {
                  const globalIndex = rowIndex * maxColumns + childIndex;
                  
                  if (isValidElement(child)) {
                    const existingClassName = (child.props as { className?: string }).className || '';
                    const newClassName = `${existingClassName} ${getAnimationClasses(globalIndex, hasIntersected)}`;

                    return cloneElement(child as React.ReactElement<{ className?: string }>, {
                      key: child.key || globalIndex,
                      className: newClassName,
                    });
                  }
                  return child;
                })}
              </div>
            </div>
          );
        }

        return (
          <div key={rowIndex} className={rowIndex > 0 ? 'mt-6' : ''}>
            {rowContent}
          </div>
        );
      })}
    </div>
  );
};

export default SmartGrid;