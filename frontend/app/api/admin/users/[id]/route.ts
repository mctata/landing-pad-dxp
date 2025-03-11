import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/auth-utils';
import { logger } from '@/lib/monitoring';

// Mock users data - imported from the parent route
// In a real app, this would be a database query
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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify the user is authenticated and has admin privileges
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (authResult.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const userId = params.id;
    
    // Find the user
    const user = mockUsers.find(user => user.id === userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    logger.error('Error in GET /api/admin/users/[id]', { error, id: params.id });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify the user is authenticated and has admin privileges
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (authResult.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const userId = params.id;
    const data = await request.json();
    
    // Find the user
    const userIndex = mockUsers.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Validate required fields
    const errors: Record<string, string> = {};
    if (!data.email) errors.email = 'Email is required';
    if (!data.firstName) errors.firstName = 'First name is required';
    if (!data.lastName) errors.lastName = 'Last name is required';
    
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }
    
    // Check if email already exists and belongs to another user
    const emailExists = mockUsers.some(user => user.email === data.email && user.id !== userId);
    if (emailExists) {
      return NextResponse.json({ 
        errors: { email: 'Email already in use' } 
      }, { status: 400 });
    }
    
    // In a real application, you would update the user in the database here
    const updatedUser = {
      ...mockUsers[userIndex],
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      role: data.role || mockUsers[userIndex].role,
      status: data.status || mockUsers[userIndex].status
    };
    
    // Update the user in the mock data
    mockUsers[userIndex] = updatedUser;
    
    return NextResponse.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    logger.error('Error in PUT /api/admin/users/[id]', { error, id: params.id });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify the user is authenticated and has admin privileges
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (authResult.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const userId = params.id;
    
    // Find the user
    const userIndex = mockUsers.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if it's the last admin user
    if (mockUsers[userIndex].role === 'admin') {
      const adminCount = mockUsers.filter(user => user.role === 'admin').length;
      if (adminCount <= 1) {
        return NextResponse.json({ 
          error: 'Cannot delete the last admin user' 
        }, { status: 400 });
      }
    }
    
    // In a real application, you would delete the user from the database here
    // For this demo, we'll remove the user from our array
    mockUsers.splice(userIndex, 1);
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Error in DELETE /api/admin/users/[id]', { error, id: params.id });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}