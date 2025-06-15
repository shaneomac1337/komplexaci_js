'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { usePlaylist } from '@/hooks/usePlaylist';

export default function AdminPage() {
  const { user, isLoading, isAuthenticated, isAdmin, loginWithDiscord, logout } = useSupabaseAuth();
  const { tracks, loading: playlistLoading, uploadTrack, deleteTrack, updateTrack } = usePlaylist();
  const [uploadForm, setUploadForm] = useState({ title: '', artist: '', tags: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingTrack, setEditingTrack] = useState<string | null>(null);



  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill title from filename
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setUploadForm(prev => ({ ...prev, title: nameWithoutExt }));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadForm.title || !uploadForm.artist) {
      alert('Please fill in all required fields and select a file');
      return;
    }

    setUploading(true);
    try {
      await uploadTrack(selectedFile, uploadForm);
      setUploadForm({ title: '', artist: '', tags: '' });
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      alert('Track uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload track');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (trackId: string, trackTitle: string) => {
    if (confirm(`Are you sure you want to delete "${trackTitle}"?`)) {
      try {
        await deleteTrack(trackId);
        alert('Track deleted successfully!');
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete track');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            🎵 KOMPG Trax Admin
          </h1>

          <div className="text-center mb-6">
            <p className="text-gray-300 mb-4">
              Pro přístup do admin panelu se musíte přihlásit přes Discord.
            </p>
          </div>

          <button
            onClick={loginWithDiscord}
            className="w-full flex items-center justify-center space-x-2 bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-3 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <span>Přihlásit se přes Discord</span>
          </button>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              ← Zpět na hlavní stránku
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            🚫 Přístup odepřen
          </h1>

          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-3 mb-4">
              {user?.image && (
                <img
                  src={user.image}
                  alt={user.name || 'User'}
                  className="w-12 h-12 rounded-full border-2 border-purple-500"
                />
              )}
              <div>
                <p className="text-white font-medium">{user?.name}</p>
                <p className="text-gray-400 text-sm capitalize">{user?.role}</p>
              </div>
            </div>

            <p className="text-gray-300 mb-4">
              Nemáte oprávnění pro přístup do admin panelu. Kontaktujte administrátora pro udělení admin práv.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={logout}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Odhlásit se
            </button>

            <a
              href="/"
              className="block text-center text-gray-400 hover:text-white text-sm transition-colors"
            >
              ← Zpět na hlavní stránku
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-white">
              🎵 KOMPG Trax Admin Panel
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Welcome, {user?.username}</span>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                📤 Upload New Track
              </h2>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-400">
                    {selectedFile ? selectedFile.name : 'Select an audio file'}
                  </p>
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    id="file-upload"
                    onChange={handleFileSelect}
                  />
                  <label
                    htmlFor="file-upload"
                    className="mt-4 inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md cursor-pointer transition-colors"
                  >
                    Choose File
                  </label>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Artist *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.artist}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, artist: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="rock, metal, alternative"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {uploading ? 'Uploading...' : 'Upload Track'}
                </button>
              </form>
            </div>
          </div>

          {/* Playlist Management */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                🎵 Current Playlist ({tracks.length} tracks)
              </h2>

              {playlistLoading ? (
                <div className="text-gray-400">Loading playlist...</div>
              ) : tracks.length === 0 ? (
                <div className="text-gray-400">No tracks in playlist. Upload some music!</div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {tracks.map((track, index) => (
                    <div key={track.id} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-400 text-sm w-8">#{index + 1}</span>
                          <div>
                            <h3 className="text-white font-medium">{track.title}</h3>
                            <p className="text-gray-400 text-sm">{track.artist}</p>
                            {track.tags && track.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {track.tags.map((tag, tagIndex) => (
                                  <span
                                    key={tagIndex}
                                    className="bg-purple-600 text-white text-xs px-2 py-1 rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingTrack(editingTrack === track.id ? null : track.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          {editingTrack === track.id ? 'Cancel' : 'Edit'}
                        </button>
                        <button
                          onClick={() => handleDelete(track.id, track.title)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
