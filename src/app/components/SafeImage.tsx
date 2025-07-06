'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface SafeImageProps {
  src: string | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallback?: React.ReactNode;
  unoptimized?: boolean;
}

export default function SafeImage({
  src,
  alt,
  width,
  height,
  className = '',
  fallback,
  unoptimized = false
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Log image loading attempts for debugging
  React.useEffect(() => {
    if (src) {
      console.log(`🖼️ SafeImage loading: ${src} for ${alt}`);
    }
  }, [src, alt]);

  // If no src provided or error occurred, show fallback
  if (!src || hasError) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Default fallback - initials circle
    return (
      <div 
        className={`bg-gray-600 rounded-full flex items-center justify-center border border-gray-600 ${className}`}
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <span className="text-white text-xs font-bold">
          {alt.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div 
          className={`absolute inset-0 bg-gray-600 rounded-full animate-pulse ${className}`}
          style={{ width: `${width}px`, height: `${height}px` }}
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        unoptimized={unoptimized}
        onLoad={() => {
          console.log(`✅ SafeImage loaded: ${src} for ${alt}`);
          setIsLoading(false);
        }}
        onError={(error) => {
          console.error(`❌ SafeImage failed to load: ${src} for ${alt}`, error);
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
}
