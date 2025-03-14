import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  email: string;
  role: string;
  name: string;
  subscription?: string;
}

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Verifies the authentication status of a request by checking the JWT token
 * Used in server-side API routes
 */
export async function verifyAuth(request: Request | NextRequest): Promise<AuthResult> {
  try {
    // Get the token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Try to get the token from cookies as fallback
      const cookieStore = cookies();
      const tokenFromCookie = cookieStore.get('token')?.value;
      
      if (!tokenFromCookie) {
        return { success: false, error: 'No authentication token provided' };
      }
      
      // Validate and decode the token from cookie
      try {
        const decodedToken = jwtDecode<User & { exp: number }>(tokenFromCookie);
        
        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (decodedToken.exp < currentTime) {
          return { success: false, error: 'Token expired' };
        }
        
        return { 
          success: true, 
          user: {
            id: decodedToken.id,
            email: decodedToken.email,
            role: decodedToken.role,
            name: decodedToken.name,
            subscription: decodedToken.subscription
          }
        };
      } catch (error) {
        return { success: false, error: 'Invalid token' };
      }
    }
    
    // Extract token from the Authorization header
    const token = authHeader.split(' ')[1];
    
    // Validate and decode the token
    try {
      const decodedToken = jwtDecode<User & { exp: number }>(token);
      
      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (decodedToken.exp < currentTime) {
        return { success: false, error: 'Token expired' };
      }
      
      return { 
        success: true, 
        user: {
          id: decodedToken.id,
          email: decodedToken.email,
          role: decodedToken.role,
          name: decodedToken.name,
          subscription: decodedToken.subscription
        }
      };
    } catch (error) {
      return { success: false, error: 'Invalid token' };
    }
  } catch (error) {
    return { success: false, error: 'Authentication error' };
  }
}

/**
 * Checks if the user has admin privileges
 */
export function isAdmin(user?: User | null): boolean {
  return user?.role === 'admin';
}

/**
 * Gets the authentication token from various sources
 * Can be used client-side
 */
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}