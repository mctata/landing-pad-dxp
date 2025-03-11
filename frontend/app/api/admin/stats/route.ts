import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/auth-utils';
import { logger } from '@/lib/monitoring';

// Mock stats data (in a real app, this would be fetched from a database)
const mockStats = {
  users: 87,
  websites: 142,
  deployments: 438,
  domains: 76,
  failedDeployments: 12,
  activeDomains: 68
};

// Mock recent deployments (in a real app, this would be fetched from a database)
const mockRecentDeployments = [
  {
    id: '1',
    status: 'success',
    version: 'v1.2.4',
    commitMessage: 'Updated homepage hero section',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 1.9 * 60 * 60 * 1000).toISOString(),
    buildTime: 5400,
    website: {
      name: 'Corporate Website'
    },
    user: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    }
  },
  {
    id: '2',
    status: 'failed',
    version: 'v1.2.5',
    commitMessage: 'Adding new product section',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 4.9 * 60 * 60 * 1000).toISOString(),
    buildTime: 3200,
    website: {
      name: 'Product Showcase'
    },
    user: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com'
    }
  },
  {
    id: '3',
    status: 'success',
    version: 'v2.0.0',
    commitMessage: 'Major redesign of landing page',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 23.9 * 60 * 60 * 1000).toISOString(),
    buildTime: 8700,
    website: {
      name: 'Marketing Campaign'
    },
    user: {
      firstName: 'Emily',
      lastName: 'Davis',
      email: 'emily@example.com'
    }
  },
  {
    id: '4',
    status: 'success',
    version: 'v1.1.2',
    commitMessage: 'Fixed footer links',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 47.95 * 60 * 60 * 1000).toISOString(),
    buildTime: 2900,
    website: {
      name: 'Blog Site'
    },
    user: {
      firstName: 'Robert',
      lastName: 'Johnson',
      email: 'robert@example.com'
    }
  },
  {
    id: '5',
    status: 'in_progress',
    version: 'v2.1.0',
    commitMessage: 'Adding analytics integration',
    createdAt: new Date(Date.now() - 0.5 * 60 * 60 * 1000).toISOString(),
    completedAt: null,
    buildTime: null,
    website: {
      name: 'E-commerce Site'
    },
    user: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com'
    }
  }
];

export async function GET(request: Request) {
  try {
    // Verify the user is authenticated and has admin privileges
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (authResult.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // In a real application, you would fetch stats from a database
    return NextResponse.json({
      stats: mockStats,
      recentDeployments: mockRecentDeployments
    });
  } catch (error) {
    logger.error('Error in GET /api/admin/stats', { error });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}