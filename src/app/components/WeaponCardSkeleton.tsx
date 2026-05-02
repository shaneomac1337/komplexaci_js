'use client';

interface WeaponCardSkeletonProps {
  count?: number;
}

const WeaponCardSkeleton: React.FC<WeaponCardSkeletonProps> = ({ count = 6 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="cs2-skel-card">
          <div className="cs2-skel-bar" />
          <div className="cs2-skel-img" />
          <div className="body" style={{ padding: '14px 16px 16px' }}>
            <div className="cs2-skel-line medium" />
            <div className="cs2-skel-line short" />
            <div className="cs2-skel-strip" />
          </div>
        </div>
      ))}
    </>
  );
};

export default WeaponCardSkeleton;
