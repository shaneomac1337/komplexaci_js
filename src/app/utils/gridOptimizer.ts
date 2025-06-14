/**
 * Grid Optimizer Utility
 * 
 * This utility provides functions to optimize grid layouts based on the number of items,
 * ensuring better visual balance for both even and odd numbers of items.
 */

export interface GridConfig {
  itemCount: number;
  maxWidth?: string;
  gapSize?: 'sm' | 'md' | 'lg';
  centerSingle?: boolean;
  centerDouble?: boolean;
}

export interface GridLayout {
  className: string;
  description: string;
  breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
    wide?: number;
  };
}

/**
 * Determines the optimal grid layout based on item count with max 3 columns and smart centering
 */
export const getOptimalGridLayout = (config: GridConfig): GridLayout => {
  const { itemCount, maxWidth, gapSize = 'md', centerSingle = true, centerDouble = true } = config;
  
  // Gap size mapping
  const gaps = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  };
  
  const gap = gaps[gapSize];
  const baseClasses = `grid ${gap} mt-8`;
  
  // Special cases for small numbers
  if (itemCount === 1) {
    return {
      className: `${baseClasses} grid-cols-1 ${centerSingle ? 'max-w-md mx-auto' : ''} ${maxWidth || ''}`,
      description: 'Single item centered layout',
      breakpoints: { mobile: 1, tablet: 1, desktop: 1 }
    };
  }
  
  if (itemCount === 2) {
    return {
      className: `${baseClasses} grid-cols-1 md:grid-cols-2 ${centerDouble ? 'max-w-4xl mx-auto' : ''} ${maxWidth || ''}`,
      description: 'Two items side by side on larger screens',
      breakpoints: { mobile: 1, tablet: 2, desktop: 2 }
    };
  }
  
  // For 3 or more items, use max 3 columns with smart centering for incomplete rows
  const remainder = itemCount % 3;
  let additionalClasses = '';
  let description = '';
  
  if (remainder === 0) {
    // Perfect 3-column layout (3, 6, 9, 12, etc.)
    description = `${itemCount} items in perfect 3-column layout`;
  } else if (remainder === 1) {
    // Examples: 4 (3+1), 7 (3+3+1), 10 (3+3+3+1)
    // Add CSS to center the last single item
    additionalClasses = ' [&>*:last-child]:col-start-2 [&>*:last-child]:lg:col-start-2';
    description = `${itemCount} items with last single item centered`;
  } else if (remainder === 2) {
    // Examples: 5 (3+2), 8 (3+3+2), 11 (3+3+3+2)
    // Add CSS to center the last two items
    additionalClasses = ' [&>*:nth-last-child(2)]:lg:col-start-1 [&>*:nth-last-child(1)]:lg:col-start-3';
    description = `${itemCount} items with last two items centered`;
  }
  
  return {
    className: `${baseClasses} grid-cols-1 md:grid-cols-2 lg:grid-cols-3${additionalClasses} ${maxWidth || ''}`,
    description,
    breakpoints: { mobile: 1, tablet: 2, desktop: 3 }
  };
};

/**
 * Analyzes grid layout efficiency
 */
export const analyzeGridLayout = (itemCount: number): {
  efficiency: number;
  emptySpaces: number;
  recommendation: string;
} => {
  const layout = getOptimalGridLayout({ itemCount });
  const desktopCols = layout.breakpoints.desktop;
  const rows = Math.ceil(itemCount / desktopCols);
  const totalSpaces = rows * desktopCols;
  const emptySpaces = totalSpaces - itemCount;
  const efficiency = (itemCount / totalSpaces) * 100;
  
  let recommendation = '';
  if (efficiency >= 90) {
    recommendation = 'Excellent layout efficiency';
  } else if (efficiency >= 75) {
    recommendation = 'Good layout with minimal empty spaces';
  } else if (efficiency >= 60) {
    recommendation = 'Acceptable layout, consider alternative arrangements';
  } else {
    recommendation = 'Consider grouping items or using different layout';
  }
  
  return {
    efficiency: Math.round(efficiency),
    emptySpaces,
    recommendation
  };
};

/**
 * Generates CSS classes for custom grid layouts
 */
export const generateCustomGridClasses = (
  mobile: number,
  tablet: number,
  desktop: number,
  wide?: number
): string => {
  let classes = `grid grid-cols-${mobile}`;
  
  if (tablet !== mobile) {
    classes += ` md:grid-cols-${tablet}`;
  }
  
  if (desktop !== tablet) {
    classes += ` lg:grid-cols-${desktop}`;
  }
  
  if (wide && wide !== desktop) {
    classes += ` xl:grid-cols-${wide}`;
  }
  
  return classes;
};
