# Videotvorba Feature Documentation

## Overview

The Videotvorba (Video Content) feature is a dedicated section of the Komplexaci gaming community website that showcases YouTube content from the clan's channel. It provides an immersive, full-screen experience with embedded videos, responsive design, and smooth animations.

**Key Features:**
- Featured latest video section with prominent display (derived from `VIDEO_CATEGORIES.latest`)
- Category-grouped video collection (7 videos across the `latest`, `retro`, and `gaming` categories)
- Category filter chips that narrow the displayed grid by active category
- Responsive design for mobile, tablet, and desktop
- Animated particle background effects
- Direct integration with YouTube channel
- Call-to-action sections for channel subscription

**Live URL Structure:**
```
https://yourdomain.com/videotvorba
```

---

## File Structure

```
src/app/videotvorba/
├── page.tsx          # Main component with video configuration
├── layout.tsx        # Layout with metadata
├── videotvorba.css   # Feature-specific styles (imported by page.tsx)
└── README.md         # This documentation file
```

**Dependencies:**
- `komplexaci.css` - Shared styling including particle animations
- `videotvorba.css` - Feature-specific styling
- Next.js Image and Link components
- React hooks (useState, useEffect, useMemo, useRef)

---

## YouTube Integration

### Embed Approach

The feature uses YouTube's iframe embed API to display videos directly on the page. This approach provides:

1. **Native YouTube Player:** Full playback controls, quality settings, and fullscreen support
2. **Privacy-Respecting:** Only loads when the page is accessed
3. **Responsive Embeds:** Uses aspect-ratio CSS to maintain 16:9 video proportions
4. **Performance:** Defers video loading until iframe is initialized

### Video URL Format

YouTube video IDs are extracted from standard YouTube URLs:

```
Full URL:  https://www.youtube.com/watch?v=5CnFK-7bRQc
Video ID:  5CnFK-7bRQc

Embed URL: https://www.youtube.com/embed/5CnFK-7bRQc
```

---

## Video Configuration

### The `VIDEO_CATEGORIES` Structure

All videos are defined in a single `VIDEO_CATEGORIES` constant near the top of `page.tsx`. It maps each category key (`latest`, `retro`, `gaming`) to a label and a list of videos:

```typescript
type Video = {
  id: string;          // YouTube video ID
  title: string;       // Display title
  description: string; // Short description
  views?: string;      // Optional view count
  featured?: boolean;  // Optional featured flag
  platform?: string;   // Optional platform tag (e.g. 'PS2', 'PSX')
};

const VIDEO_CATEGORIES: Record<'latest' | 'retro' | 'gaming', { label: string; videos: Video[] }> = {
  latest: { label: 'Nejnovější', videos: [ /* ... */ ] },
  retro:  { label: 'Retro Gaming', videos: [ /* ... */ ] },
  gaming: { label: 'Modern Gaming', videos: [ /* ... */ ] },
};
```

Derived values built from this constant:

- `featuredVideo` — the prominently displayed hero video, taken from `VIDEO_CATEGORIES.latest.videos[0]`. The hero embed, title, description, and view count all read from this object (e.g. `https://www.youtube.com/embed/${featuredVideo.id}`).
- `allVideosWithCategory` — a flattened list of every video tagged with its category key, used to render the grid and apply category filtering.

The grid cards and the hero both build their URLs from the video `id` using template literals (`embed/${video.id}`, `youtu.be/${video.id}`), so there is no separate "video ID" string to edit anywhere else.

### Adding or Updating a Video

1. **Extract the Video ID** from the YouTube URL (the part after `v=`).
   Example: `https://www.youtube.com/watch?v=abc123xyz` → ID is `abc123xyz`.

2. **Edit `VIDEO_CATEGORIES`** in `page.tsx`:
   - To add a grid video, append a `Video` object to the `videos` array of the relevant category.
   - To change the featured hero video, edit the first entry of `VIDEO_CATEGORIES.latest.videos` (its `id`, `title`, `description`, and `views`).
   - To remove a video, delete its object from the category's `videos` array.

3. **Save and deploy** — the page hot-reloads in development; commit and push for production.

**Best Practices:**
- Keep titles concise and descriptions to 1-2 sentences.
- Use Czech language for consistency with site content.
- Place a video in the category that matches its content (`latest`, `retro`, or `gaming`).
- Order videos within a category by relevance (newest or most popular first).

---

## Component Structure

### Architecture

```
VideotvorbaPage (Client Component)
├── State Management
│   ├── isLoaded (controls animation timing)
│   ├── activeCategory (selected category filter)
│   └── clock (live HH:MM:SS readout via a clock hook)
│
├── Navigation Header
│   └── Back to homepage link
│
├── Hero Section
│   ├── YouTube icon with gradient
│   ├── Page title
│   ├── Description
│   └── CTA buttons (Subscribe, View All)
│
├── Channel Stats Section
│   └── 3-column grid with stats cards
│
├── Featured Latest Video Section
│   ├── Heading with emoji
│   ├── Large video embed
│   ├── Title and description
│   └── Link to all videos
│
├── Featured Videos Grid Section
│   ├── Heading
│   ├── Category filter chips (activeCategory)
│   ├── 3-column responsive grid
│   │   └── Video cards (map over allVideosWithCategory, filtered by activeCategory)
│   │       ├── Embedded iframe
│   │       ├── Title
│   │       ├── Description
│   │       └── YouTube link
│   └── Channel description box
│       └── Topic tags
│
├── Call to Action Section
│   └── Subscription prompt with CTA button
│
└── Footer
    └── Links and copyright
```

### Client-Side Features

The component is marked with `"use client"` to enable:

1. **Animation States:** Fade-in and slide-up transitions on mount
2. **Interactive Hover Effects:** Scale and glow effects on cards
3. **Dynamic Rendering:** Video grid generated from `allVideosWithCategory`, filtered by the active category
4. **Live Clock:** HH:MM:SS broadcast readout driven by a clock hook

**Animation Timing:**
```typescript
useEffect(() => {
  setIsLoaded(true);
}, []);
```

Cards animate in sequence with staggered delays:
```typescript
style={{ transitionDelay: `${index * 150}ms` }}
```

---

## Responsive Embed Handling

### Aspect Ratio Technique

All video embeds use the aspect-ratio CSS approach for responsive sizing:

```typescript
<div className="aspect-video rounded-xl overflow-hidden">
  <iframe src="..." className="w-full h-full" />
</div>
```

**How it works:**
- `aspect-video` = Tailwind utility for 16:9 ratio
- Container enforces ratio regardless of screen size
- Iframe fills container with `w-full h-full`
- No JavaScript calculations needed

### Responsive Grid Breakpoints

The featured videos grid adapts to screen size:

```typescript
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
```

**Breakpoints:**
- Mobile (< 768px): 1 column (stacked)
- Tablet (768px - 1024px): 2 columns
- Desktop (> 1024px): 3 columns

### Mobile Optimization

- Touch-friendly button sizes (min 44px tap targets)
- Reduced animation complexity on smaller screens
- Stacked layout for easier scrolling
- Full-width video players for better viewing

---

## Styling Approach

### Design System

**Color Palette:**
- Primary: Purple (#a855f7) to Pink (#ec4899) gradients
- Accent: Red (#ff0000) for YouTube branding
- Background: Dark gray (#111827, #1f2937)
- Text: White (#ffffff) and gray scales

**Typography:**
- Headings: 'Exo 2' font family (imported globally)
- Body: System font stack
- Sizes: Responsive with Tailwind scale (text-xl, text-2xl, etc.)

### Tailwind CSS Classes

**Common Patterns:**

1. **Glass Morphism Cards:**
   ```typescript
   className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20"
   ```

2. **Gradient Text:**
   ```typescript
   className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
   ```

3. **Hover Effects:**
   ```typescript
   className="hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-500"
   ```

4. **Buttons:**
   ```typescript
   className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-red-600 to-red-700"
   ```

### Animated Background

The particle effect background is defined in `komplexaci.css`:

```css
.particles-bg {
  background-image: radial-gradient(...);
  background-repeat: repeat;
  background-size: 200px 100px;
  animation: particleMove 20s linear infinite;
}
```

**Features:**
- Animated particle movement
- Multiple gradient layers for depth
- Responsive background size on mobile
- Low-opacity to maintain readability

---

## Step-by-Step Guide: Complete Video Update

### Scenario: Update Page with New Content

**Goal:** Replace the featured latest video and add new videos to the grid

All content lives in the `VIDEO_CATEGORIES` constant in `page.tsx`. Both the hero embed and every grid card derive their YouTube URLs from a video's `id` via template literals (`embed/${video.id}`, `youtu.be/${video.id}`), so you only ever edit the data objects — never a hardcoded embed URL.

**Steps:**

1. **Gather video information** for each video: the YouTube ID (the part after `v=`), a title, and a short description. Optionally a `views` count or `platform` tag.

2. **Open `page.tsx`** and locate `VIDEO_CATEGORIES`.

3. **Replace the featured latest video** by editing the first entry of `VIDEO_CATEGORIES.latest.videos` — update its `id`, `title`, `description`, and `views`. The hero section (embed, heading, description, view count, and the `title` attribute) is rendered from this `featuredVideo` object, so no other change is needed.

4. **Add grid videos** by appending `Video` objects to the appropriate category's `videos` array (`retro` or `gaming`, or `latest` for additional recent clips). Each new video automatically appears in the grid and is included when its category filter is active.

5. **Save and test:** the page hot-reloads in development; verify embeds load and the responsive layout holds on mobile.

6. **Commit and push** the change to `page.tsx`.

---

## Content Manager Quick Reference

### Quick Update Checklist

**To update the featured latest video:**
- [ ] Extract the video ID from the YouTube URL
- [ ] Edit the first entry of `VIDEO_CATEGORIES.latest.videos` (`id`, `title`, `description`, `views`)
- [ ] Save file

**To add a video to the grid:**
- [ ] Extract the video ID from the YouTube URL
- [ ] Append a `Video` object to the relevant category's `videos` array in `VIDEO_CATEGORIES`
- [ ] Include `id`, `title`, and `description` (optionally `views`/`platform`)
- [ ] Save file

**To remove a video from the grid:**
- [ ] Find the video object in its category's `videos` array
- [ ] Delete the entire object (including curly braces and comma)
- [ ] Save file

### Common Issues and Solutions

**Problem: Video doesn't load**
- Solution: Verify video ID is correct and video is public on YouTube
- Check: Video must not be age-restricted or private

**Problem: Grid layout looks broken**
- Solution: Ensure each `Video` object is valid (commas between objects, no trailing comma issues)
- Check: Each video object has at least the `id`, `title`, and `description` fields

**Problem: Title or description has special characters**
- Solution: Escape single quotes as `\'` or use double quotes inside JSX
- Example: `title: "Player's Best Moments"` or `title: 'Player\'s Best Moments'`

**Problem: Changes don't appear on website**
- Solution: Clear browser cache or hard refresh (Ctrl+Shift+R)
- Check: Verify file was saved and deployed to production

---

## Technical Reference

### Props and Data Types

```typescript
type Video = {
  id: string;          // YouTube video ID
  title: string;       // Display title
  description: string; // Short description
  views?: string;      // Optional view count
  featured?: boolean;  // Optional featured flag
  platform?: string;   // Optional platform tag
};

type CategoryKey = 'all' | 'latest' | 'retro' | 'gaming';

const VIDEO_CATEGORIES: Record<Exclude<CategoryKey, 'all'>, { label: string; videos: Video[] }>;

// Derived helpers built from VIDEO_CATEGORIES:
const featuredVideo: Video;            // VIDEO_CATEGORIES.latest.videos[0]
const allVideosWithCategory: (Video & { category: Exclude<CategoryKey, 'all'> })[];
```

### YouTube iframe Parameters

```typescript
allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
allowFullScreen
```

**Parameter Explanation:**
- `accelerometer`: Allows device orientation
- `autoplay`: Enables autoplay if user initiates
- `clipboard-write`: Allows copy functionality
- `encrypted-media`: Enables DRM content
- `gyroscope`: Device motion detection
- `picture-in-picture`: PiP mode support
- `allowFullScreen`: Fullscreen button

### External Links

**YouTube Channel:**
- Main: `https://www.youtube.com/@MartinPenkava1337`
- Videos: `https://www.youtube.com/@MartinPenkava1337/videos`
- Subscribe: `https://www.youtube.com/@MartinPenkava1337?sub_confirmation=1`

**Individual Video:**
- Format: `https://youtu.be/{VIDEO_ID}`
- Example: `https://youtu.be/5CnFK-7bRQc`

### Performance Considerations

**Optimization Techniques:**
1. Lazy iframe loading (browser handles natively)
2. Staggered animation delays reduce initial CPU load
3. CSS transforms for animations (GPU-accelerated)
4. Backdrop blur uses compositing layers efficiently

**Recommendations:**
- Limit to 6-8 embedded videos per page
- Videos load on-demand when iframe initializes
- Consider pagination if adding more than 12 videos

---

## Future Enhancement Ideas

**Potential Features:**
- Dynamic video loading from YouTube API
- Video search and filtering
- Categories or playlists
- View count and upload date display
- Video thumbnails with play button overlay (lazy load iframes)
- Comments section integration
- Related videos suggestions
- Video analytics tracking

**Implementation Notes:**
If implementing YouTube Data API:
1. Obtain API key from Google Cloud Console
2. Install `googleapis` package
3. Fetch videos server-side or use API routes
4. Cache responses to avoid quota limits
5. Display thumbnails first, load iframe on user click

---

## Maintenance

### Regular Tasks

**Monthly:**
- Update featured latest video with newest content
- Review grid videos for relevance
- Check for broken embeds (deleted or private videos)

**Quarterly:**
- Update channel statistics if displayed
- Review and update channel description
- Verify all external links work

**As Needed:**
- Add new videos when significant content is published
- Remove outdated or low-performing videos
- Update styling to match brand changes

### Monitoring

**Check for:**
- 404 errors on embedded videos (video deleted)
- Slow page load times (too many embeds)
- Layout breaks on new devices
- Accessibility issues (screen readers, keyboard navigation)

---

## Support

**For Technical Issues:**
- Review Next.js documentation: https://nextjs.org/docs
- Check Tailwind CSS docs: https://tailwindcss.com/docs
- YouTube iframe API: https://developers.google.com/youtube/iframe_api_reference

**For Content Questions:**
- Contact website administrator
- Refer to project repository issues
- Review git commit history for examples

---

## Version History

**Current Version:** 1.0
- Initial implementation with embedded videos
- Responsive grid layout
- Featured latest video section
- Animated particle background
- Call-to-action sections
