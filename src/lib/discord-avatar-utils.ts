/**
 * Discord Avatar Utility Functions
 * Handles both static and animated (GIF) avatars properly
 */

/**
 * Checks if a Discord avatar hash represents an animated avatar
 * Animated avatars start with 'a_'
 */
export function isAnimatedAvatar(avatarHash: string | null): boolean {
  return avatarHash?.startsWith('a_') || false;
}

/**
 * Constructs the proper Discord avatar URL with correct format
 * Automatically detects animated avatars and uses GIF format
 */
export function getDiscordAvatarUrl(
  userId: string,
  avatarHash: string | null,
  size: number = 64
): string | null {
  if (!avatarHash) return null;

  const format = isAnimatedAvatar(avatarHash) ? 'gif' : 'png';
  const validSize = Math.min(4096, Math.max(16, size));
  
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${format}?size=${validSize}`;
}

/**
 * Gets the default Discord avatar URL for users without custom avatars
 */
export function getDefaultDiscordAvatarUrl(userId: string, discriminator?: string): string {
  // For new usernames (no discriminator), use modulo 6
  // For legacy usernames with discriminator, use modulo 5
  const avatarIndex = discriminator 
    ? parseInt(discriminator) % 5 
    : (parseInt(userId) >> 22) % 6;
  
  return `https://cdn.discordapp.com/embed/avatars/${avatarIndex}.png`;
}

/**
 * Gets the best available avatar URL for a Discord user
 * Handles both custom and default avatars properly
 */
export function getBestDiscordAvatarUrl(
  userId: string,
  avatarHash: string | null,
  discriminator?: string,
  size: number = 64
): string {
  if (avatarHash) {
    return getDiscordAvatarUrl(userId, avatarHash, size) || getDefaultDiscordAvatarUrl(userId, discriminator);
  }
  
  return getDefaultDiscordAvatarUrl(userId, discriminator);
}
