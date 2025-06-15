import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

async function verifyAdminAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return false;
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.role === 'admin';
  } catch (error) {
    console.error('Auth verification error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const isAdmin = await verifyAdminAuth();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const artist = formData.get('artist') as string;
    const tags = formData.get('tags') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    if (!title || !artist) {
      return NextResponse.json(
        { success: false, message: 'Title and artist are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Only audio files are allowed.' },
        { status: 400 }
      );
    }

    // Create unique filename
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const safeFileName = `track_${timestamp}${fileExtension}`;
    
    // Define upload directory
    const uploadDir = path.join(process.cwd(), 'public/komplexaci/audio');
    const filePath = path.join(uploadDir, safeFileName);

    try {
      // Ensure upload directory exists
      await mkdir(uploadDir, { recursive: true });
      
      // Convert file to buffer and save
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Add track to playlist
      const addTrackResponse = await fetch(`${request.nextUrl.origin}/api/music/playlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          artist,
          file: `/komplexaci/audio/${safeFileName}`,
          tags: tags ? tags.split(',').map(tag => tag.trim()) : []
        }),
      });

      if (!addTrackResponse.ok) {
        throw new Error('Failed to add track to playlist');
      }

      const addTrackData = await addTrackResponse.json();

      return NextResponse.json({
        success: true,
        message: 'File uploaded and track added successfully',
        data: {
          filename: safeFileName,
          path: `/komplexaci/audio/${safeFileName}`,
          track: addTrackData.data
        }
      });

    } catch (fileError) {
      console.error('File operation error:', fileError);
      return NextResponse.json(
        { success: false, message: 'Failed to save file' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Upload failed' },
      { status: 500 }
    );
  }
}
