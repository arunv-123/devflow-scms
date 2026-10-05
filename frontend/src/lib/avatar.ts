/**
 * DevFlow Consistent Profile Photo & Avatar Fallback Utility
 * 
 * Provides deterministic avatar resolution for all user roles across the application.
 * If an uploaded custom profile photo exists, it is displayed.
 * Otherwise, a deterministic fallback placeholder avatar is computed consistently
 * based on user identifier (ID, email, or name).
 */

export const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
];

/**
 * Hash string deterministically for consistent avatar fallback selection
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Returns the active avatar URL or a deterministic fallback avatar based on user info.
 */
export function getAvatarUrl(
  avatar?: string | null,
  seed?: { id?: string; email?: string; name?: string } | string | null
): string {
  if (avatar && typeof avatar === 'string' && avatar.trim() !== '') {
    return avatar;
  }
  let key = '';
  if (typeof seed === 'string') {
    key = seed;
  } else if (seed) {
    key = seed.id || seed.email || seed.name || '';
  }
  if (!key) return DEFAULT_AVATARS[0];
  const idx = hashString(key) % DEFAULT_AVATARS.length;
  return DEFAULT_AVATARS[idx];
}
