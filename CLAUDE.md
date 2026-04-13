# Astral Posts

WordPress plugin that displays astrological transit data and moon phase info on blog posts based on publish date. No competitor does this - unique niche.

## Structure

- `astral-posts.php` - Main plugin file (meta box, geocoding, asset enqueue, content filter)
- `js/astral-posts.js` - Client-side astro calculations (zodiac, moon phase, Placidus houses, aspects, SVG chart)
- `js/astronomy.min.js` - Astronomy Engine library (vendored, do not edit)
- `css/astral-posts.css` - Frontend styles

## Key Details

- Version: 1.1.0
- Plugin slug: astral-posts
- Function prefix: astral_posts_
- CSS class prefix: astral-posts-
- Meta key prefix: _astral_posts_
- Website: https://astralposts.com
- Uses [Astronomy Engine](https://github.com/cosinekitty/astronomy) for celestial calculations (client-side)
- Geocoding via OpenStreetMap Nominatim API (server-side on post save)
- Placidus house system when location is available
- No build step - plain PHP, vanilla JS (ES5), CSS
- All JS runs in an IIFE; no global exports
- Plugin targets the `post` post type only (will become configurable)

## Distribution

- **Free version** on WordPress.org
- **Pro version** sold as annual subscription ($59-79/year)
- GitHub repo: Ceremetra/AstroCalendar

## Business Model - Two Tiers

### Free - "The Sky That Day"
- Sun, Moon, planets in zodiac signs
- Basic aspects (conjunction, opposition, trine)
- Short AI-generated transit summary ("The cosmic weather today...")
- Click-to-reveal button on archive/blog pages (modal popup)
- Inline display on single post pages (collapsible)
- Works for all use cases: spiritual bloggers, astrology sites, wellness/retreat sites, creatives

### Pro - "The Full Picture" (annual subscription)
- Transit chart wheel (SVG, redesigned for visual quality)
- Houses (Placidus, location-based)
- Retrogrades
- All aspect types (+ quincunx, semi-sextile)
- Writer's natal chart overlay (optional, birth data entered once in settings)
- Transit-to-natal aspects
- Detailed AI interpretation (transit meaning + natal chart interaction)
- Chart export (SVG/PNG)
- Shortcode + Gutenberg block
- Custom color themes

### Future (not in v2)
- Reader natal chart input (visitor enters birth data, sees personal reading)
- Tarot add-on plugin
- Human Design add-on plugin

## Target Users

1. **Spiritual bloggers/diarists** - documenting their journey, transits as context for daily posts, natal overlay for personal reflection
2. **Astrology content creators** - auto-tag posts with sky data, readers expect this
3. **Wellness/yoga/retreat sites** - cosmic context for events ("this retreat happened during a Full Moon in Scorpio")
4. **Creative writers/artists** - transits as metadata for when inspiration struck
5. **Coaches/therapists** - transits explain collective patterns they're seeing

## AI Interpretations

- Uses Claude API for generating interpretations
- Pre-generated at publish time (stored as post meta), no per-visitor API cost
- Cost ~$0.01-0.03 per interpretation
- API calls routed through our license server (not direct from user's site)
- Interpretation depth: transit summary (free), detailed transit + natal interplay (Pro)

## API Cost Safeguards (Non-negotiable)

### Per-user limits
- Max 2 freshly generated interpretations per day per subscription
- Beyond that, serve cached interpretations (similar transits)

### Rate limiting / abuse prevention
- 2+ interpretation requests per minute from one user = auto-block + flag for review
- IP-based rate limiting as additional layer
- Flag and surface unusual activity patterns (bulk requests, odd-hour spikes)

### Platform-wide budget
- Monthly budget = (active subscriptions x 1 post/day x 30 x cost per interpretation) + 20% margin
- Alert at 80% of budget
- Hard stop at 100%, serve cached content only
- Hourly circuit breaker: if spend in any hour exceeds X% of monthly budget, halt all API calls

### Failsafes
- All interpretations cached, worst case = cached content, never errors
- Email/webhook notification to admin on anomalies
- Configurable monthly hard cap on total Claude API spend

## Chart Display Behavior

- **Blog/archive pages:** Button on each post, opens modal popup (loading charts inline on 10+ posts would be heavy)
- **Single post pages:** Inline at bottom, collapsible (default expanded)
- **Configurable in settings:** display mode (always visible / click to reveal / modal), where it shows (single posts / archives / both)

## Chart Design

- Current wheel design needs visual overhaul: bolder zodiac colors, larger planet symbols, better collision handling, stronger aspect lines
- Will be redesigned in the Pro feature phase

## Deployment

- Live site: https://wanderingislands.com (WordPress, password-protected)
- SSH: via staging server (`ssh secure` then `gcloud compute ssh sh1`) with sudo
- WP plugins path: `/home/wanderingislands/public_html/wp-content/plugins/astral-posts/`
- User also uploads zip files via WP Admin > Plugins > Upload
- Git push requires sourcing `~/.zshrc` for `$GITHUB_TOKEN`
