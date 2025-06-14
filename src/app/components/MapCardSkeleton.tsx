'use client';

interface MapCardSkeletonProps {
  count?: number;
}

const MapCardSkeleton: React.FC<MapCardSkeletonProps> = ({ count = 7 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 animate-pulse"
        >
          {/* Image skeleton */}
          <div className="h-48 bg-gray-600/50 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 animate-pulse">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-500/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
          
          {/* Content skeleton */}
          <div className="p-6">
            {/* Title skeleton */}
            <div className="h-6 bg-gray-600/50 rounded mb-2 w-2/3"></div>
            
            {/* Description skeleton */}
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-600/50 rounded w-full"></div>
              <div className="h-4 bg-gray-600/50 rounded w-5/6"></div>
              <div className="h-4 bg-gray-600/50 rounded w-3/4"></div>
            </div>
            
            {/* Features skeleton */}
            <div className="flex gap-2">
              <div className="h-6 bg-red-500/20 rounded w-16"></div>
              <div className="h-6 bg-red-500/20 rounded w-20"></div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default MapCardSkeleton;
