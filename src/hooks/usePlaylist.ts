'use client';

import { useState, useEffect, useCallback } from 'react';

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

interface PlaylistState {
  playlist: Playlist | null;
  loading: boolean;
  error: string | null;
}

export function usePlaylist() {
  const [state, setState] = useState<PlaylistState>({
    playlist: null,
    loading: true,
    error: null
  });

  const fetchPlaylist = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch('/api/music/playlist');
      const data = await response.json();

      if (data.success) {
        setState({
          playlist: data.data,
          loading: false,
          error: null
        });
      } else {
        setState({
          playlist: null,
          loading: false,
          error: data.message || 'Failed to fetch playlist'
        });
      }
    } catch (error) {
      console.error('Error fetching playlist:', error);
      setState({
        playlist: null,
        loading: false,
        error: 'Failed to fetch playlist'
      });
    }
  }, []);

  const addTrack = useCallback(async (trackData: {
    title: string;
    artist: string;
    file: string;
    tags?: string[];
  }) => {
    try {
      const response = await fetch('/api/music/playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trackData),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh playlist
        await fetchPlaylist();
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to add track');
      }
    } catch (error) {
      console.error('Error adding track:', error);
      throw error;
    }
  }, [fetchPlaylist]);

  const updateTrack = useCallback(async (trackId: string, updates: {
    title?: string;
    artist?: string;
    tags?: string[];
  }) => {
    try {
      const response = await fetch(`/api/music/track/${trackId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh playlist
        await fetchPlaylist();
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to update track');
      }
    } catch (error) {
      console.error('Error updating track:', error);
      throw error;
    }
  }, [fetchPlaylist]);

  const deleteTrack = useCallback(async (trackId: string) => {
    try {
      const response = await fetch(`/api/music/track/${trackId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Refresh playlist
        await fetchPlaylist();
        return true;
      } else {
        throw new Error(data.message || 'Failed to delete track');
      }
    } catch (error) {
      console.error('Error deleting track:', error);
      throw error;
    }
  }, [fetchPlaylist]);

  const uploadTrack = useCallback(async (file: File, metadata: {
    title: string;
    artist: string;
    tags?: string;
  }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', metadata.title);
      formData.append('artist', metadata.artist);
      if (metadata.tags) {
        formData.append('tags', metadata.tags);
      }

      const response = await fetch('/api/music/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Refresh playlist
        await fetchPlaylist();
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to upload track');
      }
    } catch (error) {
      console.error('Error uploading track:', error);
      throw error;
    }
  }, [fetchPlaylist]);

  // Load playlist on mount
  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  return {
    playlist: state.playlist,
    tracks: state.playlist?.tracks || [],
    loading: state.loading,
    error: state.error,
    fetchPlaylist,
    addTrack,
    updateTrack,
    deleteTrack,
    uploadTrack
  };
}
