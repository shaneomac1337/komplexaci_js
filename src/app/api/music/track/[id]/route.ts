import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth/next';
import { supabaseAdmin } from '@/lib/supabase';
import type { Playlist, Track } from '../../playlist/route';

async function verifyAuth(requiredRole: 'admin' | 'moderator' | 'member' = 'member'): Promise<{ isAuthorized: boolean; user?: any }> {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return { isAuthorized: false };
    }

    // Get user profile from Supabase
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (!profile || !profile.is_active) {
      return { isAuthorized: false };
    }

    // Check role hierarchy: admin > moderator > member
    const roleHierarchy = { admin: 3, moderator: 2, member: 1, guest: 0 };
    const userLevel = roleHierarchy[profile.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole];

    return {
      isAuthorized: userLevel >= requiredLevel,
      user: profile
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { isAuthorized: false };
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
    const { isAuthorized, user } = await verifyAuth('moderator');
    if (!isAuthorized || !user) {
      return NextResponse.json(
        { success: false, message: 'Moderator access required' },
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
    const { isAuthorized, user } = await verifyAuth('admin');
    if (!isAuthorized || !user) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
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
