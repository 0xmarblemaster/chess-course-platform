# Swan Landing Page Clone

A technical clone of the Swan (getswan.com) landing page created for educational purposes. This project replicates the structure, animations, and interactions of the original design while replacing all copyrighted content with placeholders.

## Overview

This clone captures the essence of Swan's modern SaaS landing page, including:
- Smooth scroll animations
- Interactive UI components
- Responsive design
- Professional typography and spacing
- Animated testimonial carousel
- FAQ accordion
- Chat interface demonstration

## Features Implemented

### Design & Layout
- **Hero Section**: Large headline with call-to-action buttons and social proof badges
- **Video Demo Section**: Placeholder for product demonstration video
- **How It Works**: Interactive chat interface showing Swan's AI workflow
- **Capabilities**: Feature grid showcasing data and tool integrations
- **Testimonials**: Auto-scrolling carousel with hover pause
- **Pricing**: Single-tier pricing card with feature list
- **FAQ**: Accordion-style frequently asked questions
- **Footer**: Links and contact information

### Animations
- Fade-in-up animations on scroll
- Staggered card entrance animations
- Smooth scrolling navigation
- Parallax effect on hero section
- Infinite scrolling testimonials
- Chat message animations
- Hover effects on interactive elements

### Interactions
- Sticky navigation with scroll shadow
- Accordion FAQ functionality
- Smooth anchor link scrolling
- Button hover states
- Card hover elevations
- Interactive notifications

## Technical Stack

- **HTML5**: Semantic markup with accessibility considerations
- **CSS3**:
  - Custom properties for theming
  - Flexbox and Grid layouts
  - Keyframe animations
  - Responsive design with media queries
- **JavaScript (Vanilla)**:
  - Intersection Observer API for scroll animations
  - Event delegation
  - DOM manipulation
  - Debounced scroll handlers for performance

## Fonts Used

- **Instrument Sans**: Primary font family (400, 500, 600, 700, 800)
- **Inter**: Supporting font (400, 500, 600, 700)
- **Inter Tight**: Accent font (600)

All fonts loaded from Google Fonts CDN.

## Project Structure

```
swan_landing/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # All styles and animations
├── js/
│   └── main.js         # JavaScript functionality
├── assets/             # Placeholder directory for images/icons
└── README.md           # This file
```

## Setup & Usage

1. **Open the project**:
   ```bash
   cd /home/marblemaster/Desktop/Cursor/chess-course/swan_landing
   ```

2. **View in browser**:
   - Simply open `index.html` in any modern web browser
   - Or use a local server:
     ```bash
     python3 -m http.server 8000
     # Then visit http://localhost:8000
     ```

3. **No build process required**: This is a static HTML/CSS/JS project

## Replaced Content

To respect intellectual property, the following original content has been replaced:

- **Logos**: All company logos replaced with text placeholders
- **Images**: Product screenshots and photos replaced with colored placeholders
- **Videos**: Video embeds replaced with play button placeholders
- **Icons**: Proprietary icons replaced with simple SVG shapes
- **Branding**: Swan's specific branding elements simplified

All text content, structure, and animations are preserved to maintain the learning value.

## Browser Compatibility

Tested and working in:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Responsive Breakpoints

- **Desktop**: 1024px and above
- **Tablet**: 768px to 1023px
- **Mobile**: Below 768px
- **Small Mobile**: Below 480px

## Key CSS Classes

- `.hero`: Main hero section
- `.section-badge`: Small label badges
- `.btn-primary`, `.btn-secondary`: Button styles
- `.feature-card`: Capability feature cards
- `.testimonial-card`: Customer testimonial cards
- `.chat-message`: Chat interface messages
- `.faq-item`: FAQ accordion items

## Key JavaScript Functions

- `showNotification()`: Display temporary notifications
- `debounce()`: Performance optimization for scroll events
- Intersection Observer: Scroll-triggered animations
- FAQ accordion handler
- Testimonial carousel cloning

## Performance Optimizations

- Lazy loading support for images
- Debounced scroll handlers
- CSS animations using GPU-accelerated properties
- Efficient DOM queries
- Minimal JavaScript dependencies (vanilla JS only)

## Customization

To customize this template:

1. **Colors**: Update CSS variables or search/replace color codes in `styles.css`
2. **Fonts**: Modify the Google Fonts import in `index.html`
3. **Content**: Edit text directly in `index.html`
4. **Animations**: Adjust keyframes and timing in `styles.css`
5. **Sections**: Add/remove sections by copying section blocks

## Known Limitations

- Video player is placeholder only
- No backend/form submission functionality
- Logo placeholders are text-based
- Some advanced Framer interactions simplified
- No actual CRM or tool integrations

## Educational Purpose

This project was created solely for learning web development techniques including:
- Modern CSS layout systems
- Scroll-based animations
- Responsive design patterns
- Performance optimization
- Accessibility considerations
- Clean code organization

**Original design credit**: Swan (getswan.com)

## License

This is an educational project. The structure and techniques can be learned from and adapted, but the original Swan design remains the intellectual property of its creators.

## Future Enhancements

Potential improvements:
- Add actual video player integration
- Implement form submission with validation
- Create a mobile navigation menu
- Add more micro-interactions
- Implement dark mode toggle
- Add loading states and skeleton screens
- Integrate actual CRM tools

## Author Notes

This clone demonstrates modern web development best practices while respecting the original creators' intellectual property. All copyrighted assets have been replaced with placeholders.

Built with HTML5, CSS3, and Vanilla JavaScript - no frameworks required.
