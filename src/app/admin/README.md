# Admin Dashboard Documentation

## Overview

The Admin Dashboard is a protected administrative interface for the Komplexaci gaming community website. It provides content management capabilities for music tracks, analytics oversight, and system administration functions. Access is restricted to authenticated users with appropriate role permissions.

**Location:** `src/app/admin/page.tsx`

**Primary Purpose:** Manage KOMPG Trax music library with upload, edit, and delete capabilities.

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Available Admin Functions](#available-admin-functions)
4. [Component Structure](#component-structure)
5. [API Endpoints](#api-endpoints)
6. [Access Control](#access-control)
7. [Data Storage](#data-storage)
8. [Extending Admin Functionality](#extending-admin-functionality)
9. [Security Considerations](#security-considerations)
10. [Troubleshooting](#troubleshooting)

---

## Feature Overview

### Core Features

1. **Music Track Management**
   - Upload audio files (MP3, WAV, OGG formats)
   - Edit track metadata (title, artist, tags)
   - Delete tracks from the playlist
   - View complete playlist with track count

2. **User Authentication**
   - Discord OAuth integration via NextAuth.js
   - Session-based authentication
   - Role-based access control

3. **Real-time Updates**
   - Automatic playlist refresh after modifications
   - Live track count display
   - Immediate feedback for user actions

### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | Next.js 15 (App Router) | Server-side rendering and routing |
| Auth Provider | NextAuth.js 4.24.11 | Discord OAuth authentication |
| Database | Supabase | User profile and role management |
| Storage | File system + JSON | Audio files and playlist metadata |
| State Management | React Hooks | Client-side state management |
| UI Framework | Tailwind CSS 4.x | Responsive styling |

---

## Authentication & Authorization

### Authentication Flow

The admin dashboard uses a multi-layered authentication system:

```
User Request
    ↓
NextAuth Session Check
    ↓
Supabase Profile Lookup
    ↓
Role Verification
    ↓
Grant/Deny Access
```

### Implementation Details

**File:** `src/hooks/useSupabaseAuth.ts`

The authentication system provides:

```typescript
const {
  user,              // User profile object
  isLoading,         // Auth state loading
  isAuthenticated,   // User is logged in
  isAdmin,           // User has admin role
  isModerator,       // User has moderator+ role
  isMember,          // User has member+ role
  loginWithDiscord,  // Initiate Discord OAuth
  logout,            // Sign out user
  checkPermission    // Check specific permission
} = useSupabaseAuth();
```

### Role Hierarchy

```
admin (Level 3)
  ├── Full system access
  ├── Can delete tracks
  ├── Can edit tracks
  └── Can upload tracks

moderator (Level 2)
  ├── Can edit tracks
  └── Can upload tracks

member (Level 1)
  └── Can upload tracks

guest (Level 0)
  └── Read-only access
```

### Discord OAuth Configuration

**Environment Variables Required:**

```bash
# Discord Application Credentials
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret

# NextAuth Configuration
NEXTAUTH_SECRET=your_32_char_random_string
NEXTAUTH_URL=http://localhost:3000
```

**OAuth Flow:**
1. User clicks "Login with Discord"
2. Redirected to Discord authorization page
3. Discord returns with user profile (scope: `identify email`)
4. NextAuth creates session and stores in JWT
5. Supabase profile created/updated with Discord data
6. User redirected to admin dashboard

**Implementation:** `src/app/api/auth/[...nextauth]/route.ts`

### Profile Storage

User profiles are stored in Supabase `profiles` table:

```typescript
interface Profile {
  id: string;                    // UUID primary key
  discord_id: string;            // Discord user ID
  username: string;              // Discord username
  avatar_url?: string;           // Discord avatar URL
  email?: string;                // User email
  role: 'admin' | 'moderator' | 'member' | 'guest';
  permissions: string[];         // Array of permission strings
  joined_at: string;             // ISO timestamp
  last_login_at: string;         // ISO timestamp
  is_active: boolean;            // Account status
}
```

---

## Available Admin Functions

### 1. Music Track Upload

**Access Level:** Member+

**Location:** Left panel of admin dashboard

**Features:**
- Drag-and-drop file selection
- Automatic title extraction from filename
- Required fields: Title, Artist
- Optional fields: Tags (comma-separated)
- Supported formats: MP3, WAV, OGG, MPEG

**Implementation:**

```typescript
// Hook: usePlaylist()
const uploadTrack = async (file: File, metadata: {
  title: string;
  artist: string;
  tags?: string;
}) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', metadata.title);
  formData.append('artist', metadata.artist);
  formData.append('tags', metadata.tags || '');

  await fetch('/api/music/upload', {
    method: 'POST',
    body: formData
  });
};
```

**File Storage:**
- Upload directory: `public/komplexaci/audio/`
- Naming convention: `track_[timestamp].[extension]`
- Playlist metadata: `src/data/playlist.json`

**Validation:**
- File type check (MIME type validation)
- Required metadata verification
- File size limit: Configurable (default: no explicit limit)

### 2. Track Metadata Editing

**Access Level:** Moderator+

**Status:** UI placeholder exists, full implementation pending

**Planned Features:**
- Inline editing of title and artist
- Tag management
- Duration override
- Uploader attribution

**Current Implementation:**
```typescript
// Edit button toggle (lines 300-304 in page.tsx)
onClick={() => setEditingTrack(
  editingTrack === track.id ? null : track.id
)}
```

**API Endpoint:** `PUT /api/music/track/[id]`

### 3. Track Deletion

**Access Level:** Admin only

**Location:** Right panel, per-track delete button

**Process:**
1. Admin clicks "Delete" button
2. Confirmation dialog appears with track title
3. Upon confirmation, API request sent
4. Track removed from `playlist.json`
5. Playlist automatically refreshed
6. Success/error notification displayed

**Note:** Currently, the actual audio file is NOT deleted from disk (line 156-158 in `track/[id]/route.ts` shows TODO comment). Only playlist metadata is removed.

**Implementation:**

```typescript
const handleDelete = async (trackId: string, trackTitle: string) => {
  if (confirm(`Are you sure you want to delete "${trackTitle}"?`)) {
    await deleteTrack(trackId);
    alert('Track deleted successfully!');
  }
};
```

### 4. Playlist Viewing

**Access Level:** Admin only

**Location:** Right panel of admin dashboard

**Features:**
- Complete track listing with metadata
- Track numbering (sequential)
- Tag display with visual indicators
- Track count in header
- Scrollable list (max-height: 384px)
- Real-time updates after modifications

**Display Format:**
```
#[index] Title
        Artist
        [tag1] [tag2] [tag3]
        [Edit] [Delete]
```

---

## Component Structure

### Primary Component: AdminPage

**File:** `src/app/admin/page.tsx`

**Type:** Client Component (`'use client'`)

**Architecture:**

```
AdminPage
  ├── Authentication Guard
  │   ├── Loading State
  │   ├── Unauthenticated State (Login Prompt)
  │   └── Unauthorized State (Access Denied)
  │
  └── Main Dashboard (Authenticated Admin)
      ├── Header
      │   ├── Title
      │   ├── User Info
      │   └── Logout Button
      │
      └── Grid Layout (lg:grid-cols-3)
          ├── Upload Panel (col-span-1)
          │   ├── File Selector
          │   ├── Title Input
          │   ├── Artist Input
          │   ├── Tags Input
          │   └── Upload Button
          │
          └── Playlist Panel (col-span-2)
              ├── Header (Track Count)
              └── Track List
                  └── Track Item (forEach)
                      ├── Track Number
                      ├── Metadata Display
                      ├── Tag Pills
                      ├── Edit Button
                      └── Delete Button
```

### State Management

```typescript
// Authentication state (from useSupabaseAuth hook)
const { user, isLoading, isAuthenticated, isAdmin, logout } = useSupabaseAuth();

// Playlist state (from usePlaylist hook)
const { tracks, loading, uploadTrack, deleteTrack, updateTrack } = usePlaylist();

// Local component state
const [uploadForm, setUploadForm] = useState({
  title: '',
  artist: '',
  tags: ''
});
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [uploading, setUploading] = useState(false);
const [editingTrack, setEditingTrack] = useState<string | null>(null);
```

### Custom Hooks

#### 1. useSupabaseAuth

**File:** `src/hooks/useSupabaseAuth.ts`

**Purpose:** Manages user authentication and authorization

**Returns:**
```typescript
{
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isMember: boolean;
  loginWithDiscord: () => void;
  logout: () => void;
  checkPermission: (permission: string) => boolean;
}
```

**Implementation Details:**
- Uses NextAuth `useSession()` hook
- Fetches extended user data from session
- Provides computed role checks
- Handles Discord OAuth flow

#### 2. usePlaylist

**File:** `src/hooks/usePlaylist.ts`

**Purpose:** Manages playlist CRUD operations

**Returns:**
```typescript
{
  playlist: Playlist | null;
  tracks: Track[];
  loading: boolean;
  error: string | null;
  fetchPlaylist: () => Promise<void>;
  addTrack: (trackData) => Promise<Track>;
  updateTrack: (id, updates) => Promise<Track>;
  deleteTrack: (id) => Promise<boolean>;
  uploadTrack: (file, metadata) => Promise<Track>;
}
```

**Auto-refresh Behavior:**
- Fetches playlist on component mount
- Automatically refreshes after upload
- Automatically refreshes after delete
- Automatically refreshes after update

### Data Types

```typescript
// Track definition
interface Track {
  id: string;
  title: string;
  artist: string;
  file: string;              // URL path to audio file
  duration?: number | null;   // Duration in seconds
  uploadedAt: string;         // ISO timestamp
  uploadedBy: string;         // Uploader identifier
  tags?: string[];           // Genre/category tags
}

// Playlist definition
interface Playlist {
  tracks: Track[];
  lastUpdated: string;       // ISO timestamp
}
```

---

## API Endpoints

### Music Management Endpoints

#### GET /api/music/playlist

**Purpose:** Fetch current playlist

**Authentication:** None required

**Response:**
```json
{
  "success": true,
  "data": {
    "tracks": [
      {
        "id": "track_1234567890_abc123",
        "title": "Song Title",
        "artist": "Artist Name",
        "file": "/komplexaci/audio/track_1234567890.mp3",
        "duration": null,
        "uploadedAt": "2025-01-15T00:00:00.000Z",
        "uploadedBy": "system",
        "tags": ["rock", "nu-metal"]
      }
    ],
    "lastUpdated": "2025-11-30T12:00:00.000Z"
  }
}
```

**File:** `src/app/api/music/playlist/route.ts`

**Implementation Notes:**
- Reads from `src/data/playlist.json`
- Returns default empty playlist if file doesn't exist
- Public endpoint (no auth required)

---

#### POST /api/music/upload

**Purpose:** Upload new audio track

**Authentication:** Required (Member+)

**Request:** `multipart/form-data`

```typescript
FormData {
  file: File;           // Audio file
  title: string;        // Track title
  artist: string;       // Artist name
  tags?: string;        // Comma-separated tags
}
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded and track added successfully",
  "data": {
    "filename": "track_1732968000123.mp3",
    "path": "/komplexaci/audio/track_1732968000123.mp3",
    "track": {
      "id": "track_1732968000123_xyz789",
      "title": "New Song",
      "artist": "New Artist",
      "file": "/komplexaci/audio/track_1732968000123.mp3",
      "tags": ["rock"]
    }
  }
}
```

**File:** `src/app/api/music/upload/route.ts`

**Process:**
1. Verify user authentication and role (member+)
2. Validate file type (audio/mpeg, audio/mp3, audio/wav, audio/ogg)
3. Validate required metadata (title, artist)
4. Generate unique filename with timestamp
5. Create upload directory if needed (`public/komplexaci/audio/`)
6. Write file to disk
7. Add track metadata to playlist.json via POST to `/api/music/playlist`
8. Return success response with track data

**Security:**
- Role-based access control (member minimum)
- File type validation
- MIME type checking
- Session verification via NextAuth

---

#### PUT /api/music/track/[id]

**Purpose:** Update track metadata

**Authentication:** Required (Moderator+)

**Request:**
```json
{
  "title": "Updated Title",
  "artist": "Updated Artist",
  "tags": ["updated", "tags"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Track updated successfully",
  "data": {
    "id": "track_1234567890_abc123",
    "title": "Updated Title",
    "artist": "Updated Artist",
    "tags": ["updated", "tags"],
    "file": "/komplexaci/audio/track_1234567890.mp3",
    "uploadedAt": "2025-01-15T00:00:00.000Z",
    "uploadedBy": "system"
  }
}
```

**File:** `src/app/api/music/track/[id]/route.ts`

**Process:**
1. Verify moderator+ role
2. Validate required fields (title, artist)
3. Find track by ID in playlist
4. Update metadata (preserves file, uploadedAt, uploadedBy)
5. Write updated playlist to disk
6. Return updated track

---

#### DELETE /api/music/track/[id]

**Purpose:** Delete track from playlist

**Authentication:** Required (Admin only)

**Response:**
```json
{
  "success": true,
  "message": "Track deleted successfully"
}
```

**File:** `src/app/api/music/track/[id]/route.ts`

**Process:**
1. Verify admin role
2. Find track by ID in playlist
3. Remove track from array
4. Write updated playlist to disk
5. Return success response

**Important Note:**
Currently does NOT delete the actual audio file from disk. The file remains in `public/komplexaci/audio/`. This is intentional (see line 156-158 TODO comment) to prevent accidental data loss. Physical file deletion should be implemented carefully with backup procedures.

---

### Analytics Endpoints (Admin Context)

These endpoints are relevant to admin users for system monitoring:

#### GET /api/analytics/status

**Purpose:** System health and analytics overview

**Authentication:** None required

**Response Includes:**
- Discord Gateway status
- Database health
- Record counts (daily snapshots, sessions)
- Date range of stored data
- Today's activity summary
- Active members list
- Available endpoints

**File:** `src/app/api/analytics/status/route.ts`

**Use Case:** Monitor system health, check data retention, verify Discord bot connectivity

---

#### POST /api/analytics/admin/reset-database

**Purpose:** EMERGENCY complete analytics database reset

**Authentication:** Required (Admin email whitelist)

**Security:**
- Admin email verification
- Requires explicit confirmation token
- Automatic backup before deletion (unless bypassed)
- Comprehensive audit logging

**Request:**
```
POST /api/analytics/admin/reset-database?confirm=DESTROY_ALL_ANALYTICS_DATA_PERMANENTLY
```

**Optional Parameter:**
```
&bypassBackup=true  // Skip automatic backup (dangerous)
```

**Response:**
```json
{
  "success": true,
  "message": "EMERGENCY DATABASE RESET COMPLETED",
  "warning": "ALL ANALYTICS DATA HAS BEEN PERMANENTLY DESTROYED",
  "admin": "admin@komplexaci.com",
  "backup": {
    "filename": "analytics-backup-2025-11-30T12-00-00-000Z.json",
    "recordCount": 1234,
    "createdAt": "2025-11-30T12:00:00.000Z"
  },
  "before": {
    "dailySnapshots": 100,
    "gameSessions": 500,
    "voiceSessions": 300,
    "spotifySessions": 200
  },
  "after": {
    "dailySnapshots": 0,
    "gameSessions": 0,
    "voiceSessions": 0,
    "spotifySessions": 0
  }
}
```

**File:** `src/app/api/analytics/admin/reset-database/route.ts`

**Process:**
1. Verify admin session
2. Check admin email against whitelist (line 187-198)
3. Require exact confirmation token
4. Create automatic backup (unless bypassed)
5. Delete all data from all tables in transaction
6. Reset auto-increment counters
7. Vacuum database to reclaim space
8. Create audit log entry
9. Return detailed report

**Admin Email Whitelist:**
```typescript
// Line 191-195 in reset-database/route.ts
const adminEmails = [
  'admin@komplexaci.com',
  'shane@komplexaci.com',
  // Add other admin emails
];
```

---

## Access Control

### Permission System

**File:** `src/lib/supabase.ts` (lines 68-116)

#### Available Permissions

```typescript
const PERMISSIONS = {
  // Site permissions
  'site:view': 'View public content',

  // Music permissions
  'music:view': 'View music player',
  'music:upload': 'Upload tracks',
  'music:edit': 'Edit track metadata',
  'music:delete': 'Delete tracks',
  'music:approve': 'Approve/reject uploads',
  'music:favorite': 'Favorite tracks',

  // User permissions
  'users:view': 'View user list',
  'users:manage': 'Manage user roles',
  'users:ban': 'Ban/unban users',

  // Comments permissions
  'comments:create': 'Post comments',
  'comments:edit': 'Edit own comments',
  'comments:moderate': 'Moderate all comments',

  // Admin permissions
  'admin:full': 'Full admin access'
};
```

#### Role Permission Mapping

```typescript
const ROLES = {
  guest: [
    'site:view',
    'music:view'
  ],

  member: [
    'site:view',
    'music:view',
    'music:upload',
    'music:favorite',
    'comments:create',
    'comments:edit'
  ],

  moderator: [
    'site:view',
    'music:view',
    'music:upload',
    'music:edit',
    'music:approve',
    'music:favorite',
    'comments:create',
    'comments:edit',
    'comments:moderate',
    'users:view'
  ],

  admin: [
    'admin:full'  // Implies ALL permissions
  ]
};
```

### Authorization Helpers

#### hasPermission()

```typescript
function hasPermission(
  userRole: string,
  userPermissions: string[],
  requiredPermission: string
): boolean {
  // Admin has all permissions
  if (userRole === 'admin' || userPermissions.includes('admin:full')) {
    return true;
  }

  // Check specific permission
  return userPermissions.includes(requiredPermission);
}
```

**Usage:**
```typescript
// In component
const { checkPermission } = useSupabaseAuth();
if (checkPermission('music:delete')) {
  // Show delete button
}

// In API route
const { isAuthorized, user } = await verifyAuth('admin');
if (!isAuthorized) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### API Route Authentication

**Shared Implementation:** Lines 7-39 in `upload/route.ts` and `track/[id]/route.ts`

```typescript
async function verifyAuth(
  requiredRole: 'admin' | 'moderator' | 'member' = 'member'
): Promise<{ isAuthorized: boolean; user?: any }> {
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
  const roleHierarchy = {
    admin: 3,
    moderator: 2,
    member: 1,
    guest: 0
  };

  const userLevel = roleHierarchy[profile.role] || 0;
  const requiredLevel = roleHierarchy[requiredRole];

  return {
    isAuthorized: userLevel >= requiredLevel,
    user: profile
  };
}
```

**Role Hierarchy:**
- Admin (level 3) can access admin/moderator/member endpoints
- Moderator (level 2) can access moderator/member endpoints
- Member (level 1) can access member endpoints
- Guest (level 0) has no authenticated access

---

## Data Storage

### Playlist Storage

**File:** `src/data/playlist.json`

**Structure:**
```json
{
  "tracks": [
    {
      "id": "track_1",
      "title": "She Loves Me Not",
      "artist": "Papa Roach",
      "file": "/komplexaci/audio/track1.mp3",
      "duration": null,
      "uploadedAt": "2025-01-15T00:00:00.000Z",
      "uploadedBy": "system",
      "tags": ["rock", "nu-metal"]
    }
  ],
  "lastUpdated": "2025-11-30T12:00:00.000Z"
}
```

**Access Pattern:**
- Read: Synchronous file read on every GET request
- Write: Synchronous file write on every modification
- Concurrency: No locking mechanism (potential race condition)

**Considerations:**
- No database transactions
- File I/O on every request
- Potential data loss if write fails mid-operation
- No audit trail of changes
- Manual backup required

### Audio File Storage

**Directory:** `public/komplexaci/audio/`

**File Naming:**
```
track_[timestamp].[extension]
```

Example: `track_1732968000123.mp3`

**Storage Details:**
- Files served statically via Next.js public directory
- URL path: `/komplexaci/audio/[filename]`
- No CDN integration
- No automatic cleanup of orphaned files
- No file size limits enforced

**Disk Space Considerations:**
- Deleted tracks remain on disk (metadata removed only)
- No automatic cleanup job
- Manual file management required
- Monitor disk usage manually

### User Profile Storage

**Database:** Supabase (PostgreSQL)

**Table:** `profiles`

**Schema:**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  discriminator TEXT,
  global_name TEXT,
  avatar_url TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  permissions TEXT[] DEFAULT '{}',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);
```

**Indexes:**
- Primary key on `id`
- Unique index on `discord_id`
- Index on `email` for session lookups

**Data Lifecycle:**
- Created on first Discord login
- Updated on every subsequent login
- Soft delete via `is_active` flag
- No automatic cleanup of inactive accounts

---

## Extending Admin Functionality

### Adding New Admin Features

#### 1. Create New Admin Page Section

**Example: Add User Management Section**

```typescript
// In src/app/admin/page.tsx
const [activeTab, setActiveTab] = useState<'music' | 'users'>('music');

return (
  <div className="min-h-screen bg-gray-900">
    <header className="bg-gray-800 border-b border-gray-700">
      {/* Add tab navigation */}
      <nav className="flex space-x-4">
        <button onClick={() => setActiveTab('music')}>
          Music Management
        </button>
        <button onClick={() => setActiveTab('users')}>
          User Management
        </button>
      </nav>
    </header>

    <main>
      {activeTab === 'music' && <MusicManagement />}
      {activeTab === 'users' && <UserManagement />}
    </main>
  </div>
);
```

#### 2. Add New API Endpoint

**Example: Add user role management endpoint**

**File:** `src/app/api/admin/users/[userId]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { supabaseAdmin } from '@/lib/supabase';

async function verifyAdmin() {
  const session = await getServerSession();
  if (!session?.user?.email) return false;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('email', session.user.email)
    .single();

  return profile?.role === 'admin';
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  if (!await verifyAdmin()) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  const { role } = await request.json();

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ role })
    .eq('id', params.userId);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
```

#### 3. Create Custom Hook for New Feature

**Example: useUserManagement hook**

**File:** `src/hooks/useUserManagement.ts`

```typescript
'use client';

import { useState, useCallback } from 'react';

interface User {
  id: string;
  username: string;
  role: string;
  isActive: boolean;
}

export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserRole = useCallback(async (userId: string, role: string) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    await fetchUsers();
  }, [fetchUsers]);

  return { users, loading, fetchUsers, updateUserRole };
}
```

### Adding New Permissions

**File:** `src/lib/supabase.ts`

```typescript
// 1. Add to PERMISSIONS object
export const PERMISSIONS = {
  // ... existing permissions
  'analytics:view': 'View analytics dashboard',
  'analytics:export': 'Export analytics data',
};

// 2. Add to role definitions
export const ROLES = {
  // ... existing roles
  admin: [
    'admin:full',
    'analytics:view',
    'analytics:export'
  ]
};

// 3. Use in components
const { checkPermission } = useSupabaseAuth();
if (checkPermission('analytics:view')) {
  return <AnalyticsDashboard />;
}
```

### Migrating from JSON to Database

**Current Issue:** Playlist stored in JSON file has limitations:
- No transactions
- No concurrency control
- No audit trail
- Manual backups

**Migration Strategy:**

#### Step 1: Create Supabase Table

```sql
CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  tags TEXT[] DEFAULT '{}',
  duration INTEGER,
  is_approved BOOLEAN DEFAULT TRUE,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tracks_uploaded_by ON tracks(uploaded_by);
CREATE INDEX idx_tracks_approved ON tracks(is_approved);
CREATE INDEX idx_tracks_tags ON tracks USING GIN(tags);
```

#### Step 2: Migrate Existing Data

```typescript
// Migration script: scripts/migrate-playlist-to-db.ts
import { supabaseAdmin } from '@/lib/supabase';
import playlistData from '@/data/playlist.json';

async function migrate() {
  for (const track of playlistData.tracks) {
    await supabaseAdmin.from('tracks').insert({
      title: track.title,
      artist: track.artist,
      file_url: track.file,
      file_path: track.file,
      tags: track.tags || [],
      duration: track.duration,
      is_approved: true,
      created_at: track.uploadedAt
    });
  }
  console.log('Migration complete');
}

migrate();
```

#### Step 3: Update API Endpoints

```typescript
// Replace filesystem reads with database queries
// Before:
const data = await fs.readFile(PLAYLIST_FILE, 'utf8');
const playlist = JSON.parse(data);

// After:
const { data: tracks } = await supabaseAdmin
  .from('tracks')
  .select('*')
  .eq('is_approved', true)
  .order('created_at', { ascending: false });
```

#### Step 4: Update Hooks

```typescript
// Update usePlaylist hook to use database
const fetchPlaylist = async () => {
  const res = await fetch('/api/music/tracks');
  const data = await res.json();
  setTracks(data.tracks);
};
```

### Adding File Upload to Cloud Storage

**Current Issue:** Files stored in `public/` directory don't scale and complicate deployments.

**Solution: Supabase Storage**

#### Step 1: Create Storage Bucket

```typescript
// One-time setup via Supabase dashboard or API
supabaseAdmin.storage.createBucket('audio-tracks', {
  public: true,
  fileSizeLimit: 52428800, // 50MB
  allowedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg']
});
```

#### Step 2: Update Upload Handler

```typescript
// In /api/music/upload/route.ts
export async function POST(request: NextRequest) {
  // ... auth and validation

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Upload to Supabase Storage instead of filesystem
  const { data, error } = await supabaseAdmin.storage
    .from('audio-tracks')
    .upload(`tracks/${safeFileName}`, buffer, {
      contentType: file.type,
      upsert: false
    });

  if (error) throw error;

  // Get public URL
  const { data: urlData } = supabaseAdmin.storage
    .from('audio-tracks')
    .getPublicUrl(`tracks/${safeFileName}`);

  // Store URL in database
  await supabaseAdmin.from('tracks').insert({
    title,
    artist,
    file_url: urlData.publicUrl,
    file_path: data.path,
    uploaded_by: user.id,
    tags
  });
}
```

#### Step 3: Update Delete Handler

```typescript
// Delete file from storage when track deleted
const { data: track } = await supabaseAdmin
  .from('tracks')
  .select('file_path')
  .eq('id', trackId)
  .single();

await supabaseAdmin.storage
  .from('audio-tracks')
  .remove([track.file_path]);

await supabaseAdmin
  .from('tracks')
  .delete()
  .eq('id', trackId);
```

---

## Security Considerations

### Current Security Measures

1. **Authentication**
   - NextAuth.js session-based authentication
   - Discord OAuth with secure token exchange
   - HTTP-only cookies for session storage
   - CSRF protection via NextAuth

2. **Authorization**
   - Role-based access control (RBAC)
   - Server-side role verification on all protected endpoints
   - Permission checks before sensitive operations
   - Admin email whitelist for destructive operations

3. **Input Validation**
   - File type validation (MIME type checking)
   - Required field validation
   - Metadata sanitization (title, artist, tags)
   - File extension verification

4. **Session Security**
   - JWT-based sessions
   - Automatic session expiration
   - Secure session cookies
   - Server-side session validation

### Security Vulnerabilities & Mitigations

#### 1. File Upload Security

**Current Risks:**
- No file size limit enforcement
- No virus/malware scanning
- Filename collision possible
- No content validation beyond MIME type

**Recommended Mitigations:**

```typescript
// Add file size limit
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
if (file.size > MAX_FILE_SIZE) {
  return NextResponse.json(
    { error: 'File too large. Max 50MB.' },
    { status: 400 }
  );
}

// Add content validation (check actual file format)
import { parseFile } from 'music-metadata';
const metadata = await parseFile(buffer);
if (!metadata.format.container) {
  return NextResponse.json(
    { error: 'Invalid audio file' },
    { status: 400 }
  );
}

// Add UUID to prevent filename collisions
import { v4 as uuidv4 } from 'uuid';
const safeFileName = `${uuidv4()}-${sanitizeFilename(file.name)}`;
```

#### 2. Playlist File Concurrency

**Current Risk:** Race condition when multiple admins modify playlist simultaneously

**Mitigation:**

```typescript
// Add file locking
import lockfile from 'proper-lockfile';

async function writePlaylist(playlist: Playlist) {
  const release = await lockfile.lock(PLAYLIST_FILE);
  try {
    await fs.writeFile(PLAYLIST_FILE, JSON.stringify(playlist, null, 2));
  } finally {
    await release();
  }
}
```

**Better Solution:** Migrate to database with ACID transactions (see [Migrating from JSON to Database](#migrating-from-json-to-database))

#### 3. XSS Prevention

**Current Risk:** User input (title, artist, tags) rendered without sanitization

**Mitigation:**

```typescript
// Server-side sanitization
import DOMPurify from 'isomorphic-dompurify';

const sanitizedTitle = DOMPurify.sanitize(title);
const sanitizedArtist = DOMPurify.sanitize(artist);

// Or use React's built-in XSS protection (already in use)
// React automatically escapes content in JSX expressions
<h3>{track.title}</h3> // Safe
```

#### 4. IDOR (Insecure Direct Object Reference)

**Current Risk:** Track IDs are predictable (timestamp-based)

**Mitigation:**

```typescript
// Use UUIDs instead of timestamps
import { v4 as uuidv4 } from 'uuid';

const newTrack = {
  id: uuidv4(), // e.g., "550e8400-e29b-41d4-a716-446655440000"
  // ... other fields
};
```

#### 5. Rate Limiting

**Current Risk:** No rate limiting on upload endpoint (potential abuse)

**Mitigation:**

```typescript
// Add rate limiting middleware
import rateLimit from 'express-rate-limit';

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 uploads per window
  message: 'Too many uploads, please try again later'
});

// Or use Vercel's built-in rate limiting
export const config = {
  api: {
    rateLimit: {
      max: 5,
      windowMs: 15 * 60 * 1000
    }
  }
};
```

### Environment Variables Security

**Required Variables:**

```bash
# Never commit these to version control
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_BOT_TOKEN=your_bot_token
NEXTAUTH_SECRET=your_random_32_char_string
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Public variables (safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**Best Practices:**
- Use `.env.local` for local development (gitignored)
- Use environment variables in deployment platform
- Rotate secrets regularly
- Use different secrets for production/staging
- Never log sensitive environment variables

### Audit Logging

**Current State:** No audit trail for admin actions

**Recommended Implementation:**

```typescript
// Create audit log table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

// Log admin actions
async function logAuditEvent(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  metadata: any,
  request: NextRequest
) {
  await supabaseAdmin.from('audit_logs').insert({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    metadata,
    ip_address: request.headers.get('x-forwarded-for'),
    user_agent: request.headers.get('user-agent')
  });
}

// Usage in delete endpoint
await logAuditEvent(
  user.id,
  'DELETE_TRACK',
  'track',
  trackId,
  { title: track.title, artist: track.artist },
  request
);
```

---

## Troubleshooting

### Common Issues

#### 1. "Authentication required" error when logged in

**Symptoms:**
- User appears logged in (shows username/avatar)
- Upload/delete operations fail with 401 error
- `isAdmin` is false despite admin role

**Root Cause:**
- Session exists but Supabase profile lookup fails
- Email mismatch between NextAuth session and Supabase profile
- Profile marked as inactive (`is_active: false`)

**Debug Steps:**

```typescript
// Add console logging in useSupabaseAuth
console.log('Session:', session);
console.log('User:', user);
console.log('Is Admin:', isAdmin);

// Check Supabase profile
const { data, error } = await supabaseAdmin
  .from('profiles')
  .select('*')
  .eq('email', session.user.email);
console.log('Profile:', data, error);
```

**Solutions:**
1. Verify email in session matches Supabase profile
2. Check `is_active` flag in profiles table
3. Verify role is correctly set to 'admin'
4. Clear browser cookies and re-login
5. Check Supabase connection (env variables)

#### 2. File upload fails silently

**Symptoms:**
- Upload button clicks but nothing happens
- No error message displayed
- File selector works but upload doesn't trigger

**Root Cause:**
- File size too large (no error handling)
- Invalid file type (validation fails)
- Directory permissions issue
- API route timeout

**Debug Steps:**

```typescript
// Add error logging in handleUpload
const handleUpload = async (e: React.FormEvent) => {
  e.preventDefault();
  console.log('Upload started:', { selectedFile, uploadForm });

  try {
    const result = await uploadTrack(selectedFile, uploadForm);
    console.log('Upload success:', result);
  } catch (error) {
    console.error('Upload error:', error);
    alert(`Upload failed: ${error.message}`);
  }
};
```

**Solutions:**
1. Check browser console for errors
2. Verify upload directory exists and is writable
3. Check file size and type
4. Increase API route timeout in vercel.json
5. Check network tab for failed requests

#### 3. Tracks not appearing after upload

**Symptoms:**
- Upload succeeds (success message shown)
- Track not visible in playlist
- Track count doesn't increase

**Root Cause:**
- Playlist refresh failed
- File written but playlist.json not updated
- Caching issue (stale data)

**Debug Steps:**

```typescript
// Check playlist.json manually
cat src/data/playlist.json

// Add logging in usePlaylist
const fetchPlaylist = async () => {
  console.log('Fetching playlist...');
  const response = await fetch('/api/music/playlist');
  const data = await response.json();
  console.log('Playlist data:', data);
};
```

**Solutions:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Check if file exists in `public/komplexaci/audio/`
3. Verify playlist.json was updated with new track
4. Check for write permission errors in server logs
5. Manually trigger `fetchPlaylist()` in browser console

#### 4. "Access Denied" despite having admin role

**Symptoms:**
- Logged in with admin account
- Shows "Access Denied" page instead of admin dashboard
- `isAdmin` returns false

**Root Cause:**
- Session callback not enriching user object with role
- Profile role not set to 'admin' in Supabase
- Case sensitivity issue ('Admin' vs 'admin')

**Debug Steps:**

```sql
-- Check user role in Supabase
SELECT id, username, email, role, is_active
FROM profiles
WHERE email = 'your@email.com';
```

**Solutions:**
1. Update role in Supabase to exactly 'admin' (lowercase)
2. Set `is_active` to true
3. Clear session and re-login
4. Verify session callback is working (check server logs)
5. Manually update profile:

```sql
UPDATE profiles
SET role = 'admin', is_active = true
WHERE email = 'your@email.com';
```

#### 5. Delete confirmation appears but track doesn't delete

**Symptoms:**
- Confirmation dialog appears
- Click "OK" but track remains
- No error message

**Root Cause:**
- API call fails silently
- Track ID mismatch
- Admin role check fails

**Debug Steps:**

```typescript
// Add detailed logging to handleDelete
const handleDelete = async (trackId: string, trackTitle: string) => {
  console.log('Delete requested:', { trackId, trackTitle });

  if (confirm(`Are you sure you want to delete "${trackTitle}"?`)) {
    try {
      console.log('Calling deleteTrack...');
      await deleteTrack(trackId);
      console.log('Delete successful');
      alert('Track deleted successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Failed to delete track: ${error.message}`);
    }
  }
};
```

**Solutions:**
1. Check browser console for errors
2. Check network tab for 401/403 responses
3. Verify admin role is correctly set
4. Check API route logs for errors
5. Verify track ID exists in playlist.json

### Getting Help

**Diagnostic Checklist:**

```markdown
When reporting issues, please provide:

- [ ] Browser console errors (screenshot or copy/paste)
- [ ] Network tab showing failed requests (status code, response)
- [ ] Your user role (from profile in Supabase)
- [ ] Steps to reproduce the issue
- [ ] Expected vs actual behavior
- [ ] Environment (local dev vs production)
- [ ] Recent changes to code or configuration
```

**Useful Debug Commands:**

```bash
# Check if playlist file exists
ls -la src/data/playlist.json

# Check upload directory permissions
ls -la public/komplexaci/audio/

# Check environment variables
npm run env:check  # (create this script if needed)

# View server logs (Vercel)
vercel logs [deployment-url]

# Test API endpoints directly
curl http://localhost:3000/api/music/playlist
curl -X POST http://localhost:3000/api/music/upload \
  -H "Cookie: next-auth.session-token=..." \
  -F "file=@test.mp3" \
  -F "title=Test" \
  -F "artist=Test Artist"
```

---

## Future Enhancements

### Planned Features

1. **Track Editing UI**
   - Inline editing implementation
   - Bulk tag editor
   - Drag-and-drop reordering

2. **Analytics Dashboard**
   - Track play counts
   - Popular tracks chart
   - Upload statistics
   - User activity logs

3. **Advanced Music Management**
   - Playlist approval workflow (member uploads, moderator approves)
   - Featured tracks system
   - Genre/tag filtering
   - Search functionality

4. **User Management Panel**
   - View all registered users
   - Promote/demote roles
   - Ban/unban users
   - Activity history

5. **Content Moderation**
   - Flagged content review
   - Comment moderation
   - Report management

### Technical Improvements

1. **Database Migration**
   - Move from JSON to Supabase PostgreSQL
   - Add proper indexes and constraints
   - Implement audit logging

2. **Cloud Storage**
   - Migrate to Supabase Storage or S3
   - CDN integration for faster delivery
   - Automatic file cleanup

3. **Performance**
   - Implement caching (Redis)
   - Add pagination for large playlists
   - Optimize file upload with progress indicators

4. **Security**
   - Add rate limiting
   - Implement file scanning (antivirus)
   - Add 2FA for admin accounts
   - Comprehensive audit logging

5. **Developer Experience**
   - Add TypeScript strict mode
   - Implement comprehensive error handling
   - Add unit and integration tests
   - Create Storybook for components

---

## Related Documentation

- **Main README:** `C:\Users\Martin\Desktop\Projects\komplexaci_js\README.md`
- **API Documentation:** `C:\Users\Martin\Desktop\Projects\komplexaci_js\src\app\api\README.md`
- **Authentication Setup:** `C:\Users\Martin\Desktop\Projects\komplexaci_js\src\app\api\auth\[...nextauth]\route.ts`
- **Supabase Schema:** `C:\Users\Martin\Desktop\Projects\komplexaci_js\src\lib\supabase.ts`
- **Environment Variables:** `C:\Users\Martin\Desktop\Projects\komplexaci_js\.env.example`

---

## Changelog

### Version 1.0.0 (Current)
- Initial admin dashboard implementation
- Discord OAuth authentication
- Music upload functionality
- Track deletion (metadata only)
- Role-based access control
- Supabase profile integration

### Known Limitations
- No track editing UI (placeholder only)
- Physical files not deleted when track removed
- No pagination for large playlists
- No search/filter functionality
- JSON file storage (not scalable)
- No rate limiting
- No audit logging
- No file upload progress indicator

---

**Last Updated:** 2025-11-30

**Maintainer:** Komplexaci Development Team

**License:** Private - Komplexaci Gaming Community
