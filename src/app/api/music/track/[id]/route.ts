import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import type { Playlist, Track } from '../../playlist/route';

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

const PLAYLIST_FILE = path.join(process.cwd(), 'src/data/playlist.json');

async function readPlaylist(): Promise<Playlist> {
  try {
    const data = await fs.readFile(PLAYLIST_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading playlist:', error);
    return {
      tracks: [],
      lastUpdated: new Date().toISOString()
    };
  }
}

async function writePlaylist(playlist: Playlist): Promise<void> {
  try {
    playlist.lastUpdated = new Date().toISOString();
    await fs.writeFile(PLAYLIST_FILE, JSON.stringify(playlist, null, 2));
  } catch (error) {
    console.error('Error writing playlist:', error);
    throw new Error('Failed to save playlist');
  }
}

// PUT - Update track
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await verifyAdminAuth();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { title, artist, tags } = await request.json();
    const trackId = params.id;

    if (!title || !artist) {
      return NextResponse.json(
        { success: false, message: 'Title and artist are required' },
        { status: 400 }
      );
    }

    const playlist = await readPlaylist();
    const trackIndex = playlist.tracks.findIndex(track => track.id === trackId);

    if (trackIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Track not found' },
        { status: 404 }
      );
    }

    // Update track
    playlist.tracks[trackIndex] = {
      ...playlist.tracks[trackIndex],
      title,
      artist,
      tags: tags || []
    };

    await writePlaylist(playlist);

    return NextResponse.json({
      success: true,
      message: 'Track updated successfully',
      data: playlist.tracks[trackIndex]
    });
  } catch (error) {
    console.error('Error updating track:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update track' },
      { status: 500 }
    );
  }
}

// DELETE - Remove track
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await verifyAdminAuth();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const trackId = params.id;
    const playlist = await readPlaylist();
    const trackIndex = playlist.tracks.findIndex(track => track.id === trackId);

    if (trackIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Track not found' },
        { status: 404 }
      );
    }

    const track = playlist.tracks[trackIndex];
    
    // Remove track from playlist
    playlist.tracks.splice(trackIndex, 1);
    await writePlaylist(playlist);

    // TODO: Optionally delete the actual audio file
    // const filePath = path.join(process.cwd(), 'public', track.file);
    // await fs.unlink(filePath).catch(console.error);

    return NextResponse.json({
      success: true,
      message: 'Track deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting track:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete track' },
      { status: 500 }
    );
  }
}
