# Videotvorba Page - Setup Instructions

## How to Add Your YouTube Videos

### Step 1: Get Your Video IDs

1. Go to any of your YouTube videos
2. Look at the URL in the browser
3. The video ID is the part after `v=`

**Example:**
```
URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ
Video ID: dQw4w9WgXcQ
```

### Step 2: Update the page.tsx File

Open `src/app/videotvorba/page.tsx` and find these sections:

#### A. Latest Featured Video (Line ~190)
Replace `YOUR_LATEST_VIDEO_ID` with your newest video ID:
```tsx
src="https://www.youtube.com/embed/YOUR_LATEST_VIDEO_ID"
```

#### B. Featured Videos Grid (Lines ~17-47)
Replace the placeholder video IDs with your actual video IDs:
```tsx
const featuredVideos = [
  {
    id: 'dQw4w9WgXcQ', // Your actual video ID
    title: 'Your Video Title',
    description: 'Your video description'
  },
  // ... more videos
];
```

### Step 3: Customize Video Titles and Descriptions

Make the titles and descriptions match your actual videos for a better user experience.

### Example Configuration

```tsx
const featuredVideos = [
  {
    id: 'abc123xyz',
    title: 'CS:GO Epic Clutch Moments',
    description: '5v1 clutch compilation from our best matches'
  },
  {
    id: 'def456uvw',
    title: 'League of Legends Pentakill Montage',
    description: 'Our best pentakills from Season 13'
  },
  // Add up to 6 videos for the grid
];
```

## Tips for Best Results

1. **Use High-Quality Videos**: Make sure your videos have good thumbnails
2. **Vary Content**: Mix different types of content (funny moments, highlights, tutorials)
3. **Keep Descriptions Short**: 1-2 sentences work best
4. **Update Regularly**: Keep your latest video section fresh with new content

## Need Help?

If you need to add more videos or customize the layout further, you can:
- Add more video objects to the `featuredVideos` array
- Adjust the grid layout by modifying the grid classes (currently: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- Change colors and styling in the Tailwind classes
