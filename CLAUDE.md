# Wandering Astro

WordPress plugin that displays astrological transit data and moon phase info on blog posts based on publish date.

## Structure

- `wandering-astro.php` — Main plugin file (meta box, geocoding, asset enqueue, content filter)
- `js/wandering-astro.js` — Client-side astro calculations (zodiac, moon phase, Placidus houses, aspects, SVG chart)
- `js/astronomy.min.js` — Astronomy Engine library (vendored, do not edit)
- `css/wandering-astro.css` — Frontend styles

## Key Details

- Version: 1.1.0
- Uses [Astronomy Engine](https://github.com/cosinekitty/astronomy) for celestial calculations (client-side)
- Geocoding via OpenStreetMap Nominatim API (server-side on post save)
- Placidus house system when location is available
- No build step — plain PHP, vanilla JS (ES5), CSS
- All JS runs in an IIFE; no global exports
- Plugin targets the `post` post type only
