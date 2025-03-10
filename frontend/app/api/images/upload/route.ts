import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { mkdir, writeFile } from 'fs/promises';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

// Directory for storing uploaded images
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.promises.access(UPLOAD_DIR);
  } catch (error) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Handle image uploads 
 */
export async function POST(request: NextRequest) {
  try {
    // Get user session for authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Ensure upload directory exists
    await ensureUploadDir();

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG are supported.' },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const userId = session.user.id;
    const fileId = uuidv4();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}-${fileId}.${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    // Read file data
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Write file to disk
    await writeFile(filePath, fileBuffer);

    // Get file metadata
    const fileSize = fileBuffer.length;
    const name = formData.get('name') as string || file.name;
    const description = formData.get('description') as string || '';
    const alt = formData.get('alt') as string || name;
    const tags = formData.get('tags') as string || '';

    // Generate URL path for the uploaded file
    const fileUrl = `/uploads/${fileName}`;

    // Create database entry for the image (or return mock data for now)
    const imageData = {
      id: fileId,
      url: fileUrl,
      thumbnailUrl: fileUrl, // In a real implementation, generate a thumbnail
      name,
      description,
      alt,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      source: 'upload' as const,
      createdAt: new Date().toISOString(),
      size: fileSize,
      userId,
    };

    // Return success response with image data
    return NextResponse.json(imageData, { status: 201 });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
