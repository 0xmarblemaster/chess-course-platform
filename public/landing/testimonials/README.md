# Video Testimonials

This folder contains video testimonials for the Chess Empire landing page.

## Adding Videos

1. **Place your video files here** with the following names:
   - `video1.mp4`
   - `video2.mp4`
   - `video3.mp4`
   - `video4.mp4`
   - `video5.mp4`

2. **Video Specifications** (Vertical/Portrait Format):
   - Format: MP4 (H.264 codec recommended)
   - Orientation: **Vertical/Portrait** (like Instagram/TikTok)
   - Recommended dimensions: 1080x1920 pixels (9:16 aspect ratio)
   - Display size: 180x320 pixels (auto-scaled)
   - File size: Keep under 10MB for fast loading
   - Duration: 15-60 seconds recommended
   - Resolution: 1080p or 720p

3. **Optional: Custom Poster Images**
   If you want custom thumbnails instead of the placeholder:
   - Create poster images: `video1-poster.jpg`, `video2-poster.jpg`, etc.
   - Update the HTML to use: `poster="testimonials/video1-poster.jpg"`

## Current Setup

The carousel automatically:
- ✅ Scrolls horizontally in an infinite loop
- ✅ Shows 5 videos with seamless duplication
- ✅ Displays brand-colored placeholders (#5F192B maroon)
- ✅ Allows users to play/pause videos with controls
- ✅ Scales videos on hover for interaction feedback

## Customization

To change the number of videos, edit `/public/landing/index.html` in the `.train` section (around line 679).

To adjust styling (size, colors, animation speed), modify the CSS for `.testimonial-card` and `.testimonial-card video` (around line 434).
