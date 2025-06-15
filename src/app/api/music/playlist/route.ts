import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const PLAYLIST_FILE = path.join(process.cwd(), 'src/data/playlist.json');

export interface Track {
  id: string;
  title: string;
  artist: string;
  file: string;
  duration?: number | null;
  uploadedAt: string;
  uploadedBy: string;
  tags?: string[];
}

export interface Playlist {
  tracks: Track[];
  lastUpdated: string;
}

async function readPlaylist(): Promise<Playlist> {
  try {
    const data = await fs.readFile(PLAYLIST_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading playlist:', error);
    // Return default playlist if file doesn't exist
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

// GET - Fetch current playlist
export async function GET() {
  try {
    const playlist = await readPlaylist();
    return NextResponse.json({
      success: true,
      data: playlist
    });
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch playlist' },
      { status: 500 }
    );
  }
}

// POST - Add new track (requires auth)
export async function POST(request: NextRequest) {
  try {
    // TODO: Add auth verification here
    const { title, artist, file, tags } = await request.json();

    if (!title || !artist || !file) {
      return NextResponse.json(
        { success: false, message: 'Title, artist, and file are required' },
        { status: 400 }
      );
    }

    const playlist = await readPlaylist();
    
    const newTrack: Track = {
      id: `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      artist,
      file,
      duration: null,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'admin', // TODO: Get from auth
      tags: tags || []
    };

    playlist.tracks.push(newTrack);
    await writePlaylist(playlist);

    return NextResponse.json({
      success: true,
      message: 'Track added successfully',
      data: newTrack
    });
  } catch (error) {
    console.error('Error adding track:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to add track' },
      { status: 500 }
    );
  }
}
