import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/auth-utils';
import { logger } from '@/lib/monitoring';

// Mock users data (in a real app, this would be fetched from a database)
const mockUsers = [
  {
    id: '1',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    role: 'admin',
    status: 'active',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    subscription: {
      plan: 'Enterprise',
      status: 'active'
    }
  },
  {
    id: '2',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    subscription: {
      plan: 'Pro',
      status: 'active'
    }
  },
  {
    id: '3',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    role: 'editor',
    status: 'active',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    subscription: {
      plan: 'Basic',
      status: 'active'
    }
  },
  {
    id: '4',
    firstName: 'Robert',
    lastName: 'Johnson',
    email: 'robert@example.com',
    role: 'user',
    status: 'inactive',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    subscription: {
      plan: 'Free',
      status: 'inactive'
    }
  },
  {
    id: '5',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily@example.com',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    subscription: {
      plan: 'Pro',
      status: 'active'
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
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    
    // Filter users by search query
    let filteredUsers = [...mockUsers];
    if (search) {
      const lowerCaseSearch = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.firstName.toLowerCase().includes(lowerCaseSearch) ||
        user.lastName.toLowerCase().includes(lowerCaseSearch) ||
        user.email.toLowerCase().includes(lowerCaseSearch)
      );
    }
    
    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    const pagination = {
      totalItems: filteredUsers.length,
      itemsPerPage: limit,
      currentPage: page,
      totalPages: Math.ceil(filteredUsers.length / limit)
    };
    
    return NextResponse.json({
      users: paginatedUsers,
      pagination
    });
  } catch (error) {
    logger.error('Error in GET /api/admin/users', { error });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Verify the user is authenticated and has admin privileges
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (authResult.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const data = await request.json();
    
    // Validate required fields
    const errors: Record<string, string> = {};
    if (!data.email) errors.email = 'Email is required';
    if (!data.firstName) errors.firstName = 'First name is required';
    if (!data.lastName) errors.lastName = 'Last name is required';
    if (!data.password) errors.password = 'Password is required';
    
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }
    
    // Check if email already exists
    const emailExists = mockUsers.some(user => user.email === data.email);
    if (emailExists) {
      return NextResponse.json({ 
        errors: { email: 'Email already in use' } 
      }, { status: 400 });
    }
    
    // In a real application, you would create the user in the database here
    // For this demo, we'll just simulate creating a user with a new ID
    const newUser = {
      id: (mockUsers.length + 1).toString(),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      role: data.role || 'user',
      status: data.status || 'active',
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      subscription: {
        plan: 'Free',
        status: 'active'
      }
    };
    
    // In a real app, this would be saved to a database
    mockUsers.push(newUser);
    
    return NextResponse.json({
      success: true,
      user: newUser
    });
  } catch (error) {
    logger.error('Error in POST /api/admin/users', { error });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}