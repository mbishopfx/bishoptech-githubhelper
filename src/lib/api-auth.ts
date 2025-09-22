import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSingleUserId, getSingleUser } from './single-user';

// API Key Management
const MASTER_API_KEY = process.env.MASTER_API_KEY || 'gha-' + crypto.randomBytes(24).toString('hex');

export interface ApiKeyData {
  id: string;
  key: string;
  name: string;
  user_id: string;
  permissions: string[];
  rate_limit: number;
  requests_today: number;
  last_used: Date;
  created_at: Date;
  expires_at?: Date;
  is_active: boolean;
}

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function generateApiKey(name: string, userId: string): string {
  const prefix = 'gha_';
  const keyPart = crypto.randomBytes(32).toString('hex');
  return `${prefix}${keyPart}`;
}

export async function validateApiKey(request: NextRequest): Promise<{
  valid: boolean;
  user_id?: string;
  key_data?: Partial<ApiKeyData>;
  error?: string;
}> {
  const authHeader = request.headers.get('authorization');
  const apiKey = authHeader?.replace('Bearer ', '') || request.headers.get('x-api-key');

  // For single-user system, we're more lenient with API keys
  // Accept any reasonable API key or no key at all for development
  const singleUserId = getSingleUserId();
  
  // No API key required for development/personal use
  if (!apiKey) {
    return { 
      valid: true, 
      user_id: singleUserId,
      key_data: {
        name: 'Single User Access',
        permissions: ['*'],
        rate_limit: 10000
      }
    };
  }

  // Check master key
  if (apiKey === MASTER_API_KEY) {
    return { 
      valid: true, 
      user_id: singleUserId,
      key_data: {
        name: 'Master Key',
        permissions: ['*'],
        rate_limit: 10000
      }
    };
  }

  // Accept any key starting with 'gha_' for single-user system
  if (apiKey.startsWith('gha_')) {
    return { 
      valid: true, 
      user_id: singleUserId,
      key_data: {
        name: 'Personal API Key',
        permissions: ['read', 'write', 'admin'],
        rate_limit: 10000
      }
    };
  }

  // For single-user system, be very permissive
  return { 
    valid: true, 
    user_id: singleUserId,
    key_data: {
      name: 'Personal Access',
      permissions: ['*'],
      rate_limit: 5000
    }
  };
}

export function checkRateLimit(apiKey: string, limit: number = 1000): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000; // 24 hours
  const key = `rate_${apiKey}`;
  
  const existing = rateLimitStore.get(key);
  
  if (!existing || now > existing.resetTime) {
    // New window
    const resetTime = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: limit - 1, resetTime };
  }
  
  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: existing.resetTime };
  }
  
  existing.count++;
  rateLimitStore.set(key, existing);
  return { allowed: true, remaining: limit - existing.count, resetTime: existing.resetTime };
}

export function createApiResponse(data: any, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json({
    success: status < 400,
    data,
    timestamp: new Date().toISOString(),
    api_version: '1.0'
  }, { 
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'X-API-Version': '1.0',
      ...headers
    }
  });
}

export function createApiError(message: string, status = 400, code?: string) {
  return NextResponse.json({
    success: false,
    error: {
      message,
      code: code || `API_ERROR_${status}`,
      status
    },
    timestamp: new Date().toISOString(),
    api_version: '1.0'
  }, { 
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'X-API-Version': '1.0'
    }
  });
}

// Middleware wrapper for API routes (simplified for single-user system)
export function withApiAuth(handler: (request: NextRequest, context: any, authData: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context: any) => {
    try {
      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
          }
        });
      }

      // For single-user system, always authenticate as the single user
      const auth = await validateApiKey(request);
      // Auth will always be valid for single-user system
      
      // Simplified rate limiting for personal use
      const rateLimit = { allowed: true, remaining: 9999, resetTime: Date.now() + 86400000 };

      // Add rate limit headers
      const rateLimitHeaders = {
        'X-RateLimit-Limit': '10000',
        'X-RateLimit-Remaining': '9999',
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      };

      // Call the actual handler
      const response = await handler(request, context, auth);
      
      // Add rate limit headers to response
      Object.entries(rateLimitHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
    } catch (error) {
      console.error('API Auth Middleware Error:', error);
      return createApiError('Internal server error', 500, 'INTERNAL_ERROR');
    }
  };
}

// Simple wrapper that doesn't require authentication (for development/single-user)
export function withSingleUser(handler: (request: NextRequest, context: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context: any) => {
    try {
      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
          }
        });
      }

      return await handler(request, context);
    } catch (error) {
      console.error('Single User API Error:', error);
      return createApiError('Internal server error', 500, 'INTERNAL_ERROR');
    }
  };
}

export const PERMISSIONS = {
  READ_REPOS: 'repos:read',
  WRITE_REPOS: 'repos:write',
  READ_TODOS: 'todos:read',
  WRITE_TODOS: 'todos:write',
  READ_RECAPS: 'recaps:read',
  WRITE_RECAPS: 'recaps:write',
  USE_AI: 'ai:use',
  ADMIN: 'admin'
} as const;
