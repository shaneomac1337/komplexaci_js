'use client';

interface WeaponCardSkeletonProps {
  count?: number;
}

const WeaponCardSkeleton: React.FC<WeaponCardSkeletonProps> = ({ count = 6 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-gray-700/50 rounded-lg p-6 border border-gray-600 animate-pulse"
        >
          {/* Image skeleton */}
          <div className="h-24 mb-4 flex items-center justify-center bg-gray-600/50 rounded">
            <div className="w-20 h-16 bg-gray-500/50 rounded animate-pulse"></div>
          </div>
          
          {/* Title skeleton */}
          <div className="h-6 bg-gray-600/50 rounded mb-2 w-3/4"></div>
          
          {/* Price skeleton */}
          <div className="h-5 bg-red-400/30 rounded mb-4 w-1/2"></div>
          
          {/* Description skeleton */}
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-600/50 rounded w-full"></div>
            <div className="h-4 bg-gray-600/50 rounded w-4/5"></div>
          </div>
          
          {/* Stats skeleton */}
          <div className="space-y-1">
            <div className="h-3 bg-gray-500/50 rounded w-full"></div>
            <div className="h-3 bg-gray-500/50 rounded w-5/6"></div>
            <div className="h-3 bg-gray-500/50 rounded w-3/4"></div>
          </div>
        </div>
      ))}
    </>
  );
};

export default WeaponCardSkeleton;
