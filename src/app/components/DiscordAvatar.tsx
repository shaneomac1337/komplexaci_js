'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getBestDiscordAvatarUrl } from '@/lib/discord-avatar-utils';

interface DiscordAvatarProps {
  userId: string;
  avatar: string | null;
  displayName: string;
  discriminator?: string;
  size?: number;
  className?: string;
}

export default function DiscordAvatar({ 
  userId, 
  avatar, 
  displayName, 
  discriminator,
  size = 32, 
  className = '' 
}: DiscordAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // If no avatar or image failed to load, show fallback
  if (!avatar || imageError) {
    return (
      <div 
        className={`rounded-full bg-gray-600 flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <span 
          className="text-gray-300 font-medium"
          style={{ fontSize: Math.max(10, size * 0.4) }}
        >
          {displayName.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  // Construct Discord CDN URL with proper format detection
  const avatarUrl = getBestDiscordAvatarUrl(userId, avatar, discriminator, Math.min(512, size * 2));

  return (
    <div 
      className={`rounded-full overflow-hidden bg-gray-600 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={avatarUrl}
        alt={`${displayName}'s avatar`}
        width={size}
        height={size}
        className="w-full h-full object-cover"
        onError={() => {
          console.log(`Avatar failed to load for ${displayName}: ${avatarUrl}`);
          setImageError(true);
        }}
        onLoad={() => {
          console.log(`Avatar loaded successfully for ${displayName}`);
        }}
        unoptimized
      />
    </div>
  );
}
