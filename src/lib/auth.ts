import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

export interface User {
  username: string;
  role: string;
}

export async function verifyAuth(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    return {
      username: payload.username as string,
      role: payload.role as string
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

export async function requireAuth(): Promise<User> {
  const user = await verifyAuth();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

export async function requireAdminAuth(): Promise<User> {
  const user = await requireAuth();
  
  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  
  return user;
}
