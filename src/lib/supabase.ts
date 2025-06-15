import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For server-side operations that need elevated permissions
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase; // Fallback to regular client if service key is missing

// Database types
export interface Profile {
  id: string;
  discord_id: string;
  username: string;
  discriminator?: string;
  global_name?: string;
  avatar_url?: string;
  email?: string;
  role: 'admin' | 'moderator' | 'member' | 'guest';
  permissions: string[];
  joined_at: string;
  last_login_at: string;
  is_active: boolean;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  file_url: string;
  file_path?: string;
  uploaded_by: string;
  uploader?: Profile;
  tags: string[];
  duration?: number;
  is_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  creator?: Profile;
  tracks: string[]; // Array of track IDs
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Permission constants
export const PERMISSIONS = {
  // Site permissions
  'site:view': 'View public content',
  
  // Music permissions
  'music:view': 'View music player',
  'music:upload': 'Upload tracks',
  'music:edit': 'Edit track metadata',
  'music:delete': 'Delete tracks',
  'music:approve': 'Approve/reject uploads',
  'music:favorite': 'Favorite tracks',
  
  // User permissions
  'users:view': 'View user list',
  'users:manage': 'Manage user roles',
  'users:ban': 'Ban/unban users',
  
  // Comments permissions
  'comments:create': 'Post comments',
  'comments:edit': 'Edit own comments',
  'comments:moderate': 'Moderate all comments',
  
  // Admin permissions
  'admin:full': 'Full admin access'
} as const;

export const ROLES = {
  guest: ['site:view', 'music:view'],
  member: ['site:view', 'music:view', 'music:upload', 'music:favorite', 'comments:create', 'comments:edit'],
  moderator: ['site:view', 'music:view', 'music:upload', 'music:edit', 'music:approve', 'music:favorite', 'comments:create', 'comments:edit', 'comments:moderate', 'users:view'],
  admin: ['admin:full'] // Implies all permissions
} as const;

// Helper function to check permissions
export function hasPermission(userRole: string, userPermissions: string[], requiredPermission: string): boolean {
  // Admin has all permissions
  if (userRole === 'admin' || userPermissions.includes('admin:full')) {
    return true;
  }
  
  // Check specific permission
  return userPermissions.includes(requiredPermission);
}

// Helper function to get role permissions
export function getRolePermissions(role: keyof typeof ROLES): string[] {
  return [...(ROLES[role] || ROLES.guest)];
}
