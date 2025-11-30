# Videotvorba Feature Documentation

## Overview

The Videotvorba (Video Content) feature is a dedicated section of the Komplexaci gaming community website that showcases YouTube content from the clan's channel. It provides an immersive, full-screen experience with embedded videos, responsive design, and smooth animations.

**Key Features:**
- Featured latest video section with prominent display
- Grid layout of 6 selected videos with embedded players
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
└── README.md         # This documentation file
```

**Dependencies:**
- `komplexaci.css` - Shared styling including particle animations
- Next.js Image and Link components
- React hooks (useState, useEffect)

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

### Adding New Videos to the Featured Grid

Videos are configured in the `featuredVideos` array at the top of `page.tsx` (lines 15-46).

**Configuration Structure:**
```typescript
const featuredVideos = [
  {
    id: 'i3KL5t-EXPw',                    // YouTube video ID
    title: 'Video Title',                 // Display title
    description: 'Video description'      // Short description (1-2 sentences)
  },
  // Add up to 6 videos for optimal grid layout
];
```

**Step-by-Step: Adding a New Video**

1. **Extract Video ID:**
   - Navigate to your video on YouTube
   - Copy the URL from the browser
   - Extract the ID (the part after `v=`)

   Example: `https://www.youtube.com/watch?v=abc123xyz` → ID is `abc123xyz`

2. **Add to Array:**
   ```typescript
   const featuredVideos = [
     // Existing videos...
     {
       id: 'abc123xyz',
       title: 'Your New Video Title',
       description: 'Brief description of the video content'
     }
   ];
   ```

3. **Save and Deploy:**
   - Save the file
   - The page will hot-reload in development
   - Commit and deploy to production

**Best Practices:**
- Keep titles concise (under 50 characters)
- Write descriptions in 1-2 sentences (under 80 characters)
- Use Czech language for consistency with site content
- Maintain 6 videos for clean 3x2 grid on desktop
- Order videos by relevance (newest or most popular first)

### Updating the Featured Latest Video

The featured latest video appears prominently at the top of the page (lines 184-212).

**Step-by-Step Update:**

1. **Locate the Latest Video Section:**
   Find line 188 in `page.tsx`:
   ```typescript
   src="https://www.youtube.com/embed/5CnFK-7bRQc"
   ```

2. **Replace the Video ID:**
   ```typescript
   src="https://www.youtube.com/embed/YOUR_NEW_VIDEO_ID"
   ```

3. **Update Title and Description:**
   Lines 196-197:
   ```typescript
   <h3 className="text-2xl font-bold text-white mb-2">
     Your New Video Title
   </h3>
   <p className="text-gray-400">
     Brief description - view count
   </p>
   ```

4. **Update the title Attribute:**
   Line 192:
   ```typescript
   title="Your New Video Title"
   ```

**Example Complete Update:**
```typescript
<iframe
  src="https://www.youtube.com/embed/xyz789new"
  className="w-full h-full"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
  title="CS:GO Competitive Highlights March 2025"
></iframe>

{/* ... */}

<h3 className="text-2xl font-bold text-white mb-2">
  CS:GO Competitive Highlights March 2025
</h3>
<p className="text-gray-400">
  Nejlepší momenty z competitive zápasů - 245 views
</p>
```

---

## Component Structure

### Architecture

```
VideotvorbaPage (Client Component)
├── State Management
│   └── isLoaded (controls animation timing)
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
│   ├── 3-column responsive grid
│   │   └── Video cards (map over featuredVideos)
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
3. **Dynamic Rendering:** Video grid generation from array

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

**Goal:** Replace the featured latest video and add 2 new videos to the grid

**Steps:**

1. **Gather Video Information:**

   Latest Video:
   - URL: `https://www.youtube.com/watch?v=newVideo123`
   - Title: "League of Legends Team Fight Highlights"
   - Description: "Epické týmové souboje z ranked her"

   Grid Video 1:
   - URL: `https://www.youtube.com/watch?v=gridVid456`
   - Title: "Valorant ACE Montage"
   - Description: "Všechny naše ACE momenty ze sezóny 2025"

   Grid Video 2:
   - URL: `https://www.youtube.com/watch?v=gridVid789`
   - Title: "Minecraft Building Tour"
   - Description: "Prohlídka našeho klanovního serveru"

2. **Open page.tsx:**
   ```bash
   code src/app/videotvorba/page.tsx
   ```

3. **Update Featured Latest Video (Line 188):**

   Before:
   ```typescript
   src="https://www.youtube.com/embed/5CnFK-7bRQc"
   ```

   After:
   ```typescript
   src="https://www.youtube.com/embed/newVideo123"
   ```

4. **Update Latest Video Title (Line 196):**

   Before:
   ```typescript
   <h3 className="text-2xl font-bold text-white mb-2">
     Best way to play Retro Wrestling Games on Windows
   </h3>
   ```

   After:
   ```typescript
   <h3 className="text-2xl font-bold text-white mb-2">
     League of Legends Team Fight Highlights
   </h3>
   ```

5. **Update Latest Video Description (Line 197):**

   Before:
   ```typescript
   <p className="text-gray-400">
     Návod jak hrát retro wrestlingové hry na Windows - 118 views
   </p>
   ```

   After:
   ```typescript
   <p className="text-gray-400">
     Epické týmové souboje z ranked her
   </p>
   ```

6. **Update iframe title (Line 192):**

   Before:
   ```typescript
   title="Best way to play Retro Wrestling Games on Windows"
   ```

   After:
   ```typescript
   title="League of Legends Team Fight Highlights"
   ```

7. **Add New Videos to Grid (Lines 15-46):**

   Add to the `featuredVideos` array:
   ```typescript
   const featuredVideos = [
     // Existing videos...
     {
       id: 'gridVid456',
       title: 'Valorant ACE Montage',
       description: 'Všechny naše ACE momenty ze sezóny 2025'
     },
     {
       id: 'gridVid789',
       title: 'Minecraft Building Tour',
       description: 'Prohlídka našeho klanovního serveru'
     }
   ];
   ```

8. **Save and Test:**
   - Save the file (Ctrl+S or Cmd+S)
   - Check browser for hot-reload
   - Verify all embeds load correctly
   - Test responsive layout on mobile view

9. **Commit Changes:**
   ```bash
   git add src/app/videotvorba/page.tsx
   git commit -m "Update videotvorba page with new video content"
   git push
   ```

---

## Content Manager Quick Reference

### Quick Update Checklist

**To update the featured latest video:**
- [ ] Extract video ID from YouTube URL
- [ ] Update line 188 with new video ID
- [ ] Update line 196 with new title
- [ ] Update line 197 with new description
- [ ] Update line 192 with new title (for accessibility)
- [ ] Save file

**To add a video to the grid:**
- [ ] Extract video ID from YouTube URL
- [ ] Add new object to `featuredVideos` array (lines 15-46)
- [ ] Include id, title, and description
- [ ] Keep total at 6 videos for best layout
- [ ] Save file

**To remove a video from the grid:**
- [ ] Find video object in `featuredVideos` array
- [ ] Delete entire object (including curly braces and comma)
- [ ] Save file

### Common Issues and Solutions

**Problem: Video doesn't load**
- Solution: Verify video ID is correct and video is public on YouTube
- Check: Video must not be age-restricted or private

**Problem: Grid layout looks broken**
- Solution: Ensure you have valid JSON structure (commas between objects, no trailing comma)
- Check: Each video object has all three required fields (id, title, description)

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
interface FeaturedVideo {
  id: string;          // YouTube video ID (11 characters)
  title: string;       // Display title
  description: string; // Short description
}

const featuredVideos: FeaturedVideo[];
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
