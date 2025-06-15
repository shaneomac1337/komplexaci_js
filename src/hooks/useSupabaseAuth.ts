'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { hasPermission } from '@/lib/supabase';

export function useSupabaseAuth() {
  const { data: session, status } = useSession();

  const user = session?.user ? {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    role: (session.user as any).role || 'guest',
    permissions: (session.user as any).permissions || [],
    discordId: (session.user as any).discordId,
    isActive: (session.user as any).isActive ?? true
  } : null;

  const isLoading = status === 'loading';
  const isAuthenticated = !!session && !!user;
  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator' || isAdmin;
  const isMember = user?.role === 'member' || isModerator;

  const loginWithDiscord = () => {
    signIn('discord', { callbackUrl: '/' });
  };

  const logout = () => {
    signOut({ callbackUrl: '/' });
  };

  const checkPermission = (permission: string): boolean => {
    if (!user) return false;
    return hasPermission(user.role, user.permissions, permission);
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    isModerator,
    isMember,
    loginWithDiscord,
    logout,
    checkPermission,
    // Legacy compatibility
    login: loginWithDiscord
  };
}
