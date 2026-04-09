(function () {
  'use strict';

  var ZODIAC_SIGNS = [
    { name: 'Aries',       symbol: '\u2648', start: 0,   element: 'fire' },
    { name: 'Taurus',      symbol: '\u2649', start: 30,  element: 'earth' },
    { name: 'Gemini',      symbol: '\u264A', start: 60,  element: 'air' },
    { name: 'Cancer',      symbol: '\u264B', start: 90,  element: 'water' },
    { name: 'Leo',         symbol: '\u264C', start: 120, element: 'fire' },
    { name: 'Virgo',       symbol: '\u264D', start: 150, element: 'earth' },
    { name: 'Libra',       symbol: '\u264E', start: 180, element: 'air' },
    { name: 'Scorpio',     symbol: '\u264F', start: 210, element: 'water' },
    { name: 'Sagittarius', symbol: '\u2650', start: 240, element: 'fire' },
    { name: 'Capricorn',   symbol: '\u2651', start: 270, element: 'earth' },
    { name: 'Aquarius',    symbol: '\u2652', start: 300, element: 'air' },
    { name: 'Pisces',      symbol: '\u2653', start: 330, element: 'water' }
  ];

  var ALL_BODIES = [
    { body: 'Sun',     name: 'Sun',     symbol: '\u2609' },
    { body: 'Moon',    name: 'Moon',    symbol: '\u263D' },
    { body: 'Mercury', name: 'Mercury', symbol: '\u263F' },
    { body: 'Venus',   name: 'Venus',   symbol: '\u2640' },
    { body: 'Mars',    name: 'Mars',    symbol: '\u2642' },
    { body: 'Jupiter', name: 'Jupiter', symbol: '\u2643' },
    { body: 'Saturn',  name: 'Saturn',  symbol: '\u2644' },
    { body: 'Uranus',  name: 'Uranus',  symbol: '\u26E2' },
    { body: 'Neptune', name: 'Neptune', symbol: '\u2646' }
  ];

  var PLANETS = ALL_BODIES.slice(2); // without Sun and Moon

  var ASPECT_DEFS = [
    { name: 'Conjunction', symbol: '\u260C', angle: 0,   orb: 8,  color: '#a855f7' },
    { name: 'Sextile',    symbol: '\u26B9', angle: 60,  orb: 6,  color: '#3b82f6' },
    { name: 'Square',     symbol: '\u25A1', angle: 90,  orb: 7,  color: '#ef4444' },
    { name: 'Trine',      symbol: '\u25B3', angle: 120, orb: 7,  color: '#22c55e' },
    { name: 'Opposition', symbol: '\u260D', angle: 180, orb: 8,  color: '#ef4444' }
  ];

  var ELEMENT_COLORS = {
    fire:  { bg: 'rgba(220,80,60,0.15)',  stroke: 'rgba(220,80,60,0.4)' },
    earth: { bg: 'rgba(60,160,90,0.15)',   stroke: 'rgba(60,160,90,0.4)' },
    air:   { bg: 'rgba(220,180,50,0.15)',  stroke: 'rgba(220,180,50,0.4)' },
    water: { bg: 'rgba(60,120,200,0.15)',  stroke: 'rgba(60,120,200,0.4)' }
  };

  var DEG2RAD = Math.PI / 180;
  var RAD2DEG = 180 / Math.PI;

  function normalizeDeg(d) {
    return ((d % 360) + 360) % 360;
  }

  function getZodiacSign(longitude) {
    var lon = normalizeDeg(longitude);
    var index = Math.floor(lon / 30);
    var sign = ZODIAC_SIGNS[index];
    var degree = lon - sign.start;
    return {
      sign: sign.name,
      symbol: sign.symbol,
      degree: degree,
      totalLongitude: lon
    };
  }

  function formatDegree(deg) {
    var d = Math.floor(deg);
    var m = Math.floor((deg - d) * 60);
    return d + '\u00B0' + (m < 10 ? '0' : '') + m + "'";
  }

  function getMoonPhaseData(date) {
    var phaseAngle = Astronomy.MoonPhase(date);
    var illum = Astronomy.Illumination('Moon', date);
    var pct = Math.round(illum.phase_fraction * 100);

    var phaseName, emoji;
    if (phaseAngle < 22.5) {
      phaseName = 'New Moon'; emoji = '\uD83C\uDF11';
    } else if (phaseAngle < 67.5) {
      phaseName = 'Waxing Crescent'; emoji = '\uD83C\uDF12';
    } else if (phaseAngle < 112.5) {
      phaseName = 'First Quarter'; emoji = '\uD83C\uDF13';
    } else if (phaseAngle < 157.5) {
      phaseName = 'Waxing Gibbous'; emoji = '\uD83C\uDF14';
    } else if (phaseAngle < 202.5) {
      phaseName = 'Full Moon'; emoji = '\uD83C\uDF15';
    } else if (phaseAngle < 247.5) {
      phaseName = 'Waning Gibbous'; emoji = '\uD83C\uDF16';
    } else if (phaseAngle < 292.5) {
      phaseName = 'Last Quarter'; emoji = '\uD83C\uDF17';
    } else if (phaseAngle < 337.5) {
      phaseName = 'Waning Crescent'; emoji = '\uD83C\uDF18';
    } else {
      phaseName = 'New Moon'; emoji = '\uD83C\uDF11';
    }

    return { name: phaseName, emoji: emoji, illumination: pct, angle: phaseAngle };
  }

  function getEclipticLongitude(body, date) {
    if (body === 'Moon') {
      var moon = Astronomy.EclipticGeoMoon(date);
      return moon.lon;
    }
    if (body === 'Sun') {
      var sun = Astronomy.SunPosition(date);
      return sun.elon;
    }
    var geo = Astronomy.GeoVector(body, date, true);
    var ecl = Astronomy.Ecliptic(geo);
    return ecl.elon;
  }

  function angleDiff(a, b) {
    var d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
  }

  function findAspects(positions) {
    var aspects = [];
    var bodies = Object.keys(positions);
    for (var i = 0; i < bodies.length; i++) {
      for (var j = i + 1; j < bodies.length; j++) {
        var diff = angleDiff(positions[bodies[i]], positions[bodies[j]]);
        for (var k = 0; k < ASPECT_DEFS.length; k++) {
          var asp = ASPECT_DEFS[k];
          if (Math.abs(diff - asp.angle) <= asp.orb) {
            aspects.push({
              body1: bodies[i],
              body2: bodies[j],
              aspect: asp.name,
              symbol: asp.symbol,
              color: asp.color,
              orb: Math.abs(diff - asp.angle).toFixed(1)
            });
            break;
          }
        }
      }
    }
    aspects.sort(function (a, b) { return parseFloat(a.orb) - parseFloat(b.orb); });
    return aspects;
  }

  // ---------- Placidus House Calculation ----------

  function localSiderealTime(date, lonDeg) {
    var astroTime = Astronomy.MakeTime(date);
    var gast = Astronomy.SiderealTime(astroTime);
    var lst = normalizeDeg(gast * 15 + lonDeg);
    return lst;
  }

  function obliquity(date) {
    var jd = Astronomy.MakeTime(date).tt + 2451545.0;
    var T = (jd - 2451545.0) / 36525.0;
    return 23.4392911 - 0.0130042 * T - 1.64e-7 * T * T + 5.04e-7 * T * T * T;
  }

  function calcPlacidusHouses(date, latDeg, lonDeg) {
    var lst = localSiderealTime(date, lonDeg);
    var eps = obliquity(date) * DEG2RAD;
    var latRad = latDeg * DEG2RAD;

    var ramc = lst * DEG2RAD;
    var mc = normalizeDeg(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) * RAD2DEG);

    var ascNum = Math.cos(ramc);
    var ascDen = -(Math.sin(ramc) * Math.cos(eps) + Math.tan(latRad) * Math.sin(eps));
    var asc = normalizeDeg(Math.atan2(ascNum, ascDen) * RAD2DEG + 180);

    var cusps = new Array(12);
    cusps[0] = asc;
    cusps[9] = mc;
    cusps[3] = normalizeDeg(mc + 180);
    cusps[6] = normalizeDeg(asc + 180);

    cusps[10] = placidusCusp(ramc, latRad, eps, 1/3, false);
    cusps[11] = placidusCusp(ramc, latRad, eps, 2/3, false);
    cusps[1]  = placidusCusp(ramc, latRad, eps, 2/3, true);
    cusps[2]  = placidusCusp(ramc, latRad, eps, 1/3, true);

    cusps[4] = normalizeDeg(cusps[10] + 180);
    cusps[5] = normalizeDeg(cusps[11] + 180);
    cusps[7] = normalizeDeg(cusps[1] + 180);
    cusps[8] = normalizeDeg(cusps[2] + 180);

    return cusps;
  }

  function placidusCusp(ramc, latRad, eps, fraction, isBelowHorizon) {
    var offset = isBelowHorizon ? 90 + fraction * 90 : fraction * 90;
    var ra = normalizeDeg((ramc * RAD2DEG) + offset) * DEG2RAD;

    for (var i = 0; i < 50; i++) {
      var decl = Math.asin(Math.sin(eps) * Math.sin(ra));
      var ad = Math.asin(Math.tan(latRad) * Math.tan(decl));
      if (isNaN(ad)) ad = 0;

      var sa, target;
      if (isBelowHorizon) {
        sa = Math.PI / 2 + ad;
        target = ramc + Math.PI + fraction * sa;
      } else {
        sa = Math.PI / 2 - ad;
        target = ramc + fraction * sa;
      }
      var newRa = normalizeDeg(target * RAD2DEG) * DEG2RAD;
      if (Math.abs(newRa - ra) < 1e-8) break;
      ra = newRa;
    }

    var lon = Math.atan2(Math.sin(ra) * Math.cos(eps), Math.cos(ra));
    return normalizeDeg(lon * RAD2DEG);
  }

  function getHouse(longitude, cusps) {
    var lon = normalizeDeg(longitude);
    for (var i = 0; i < 12; i++) {
      var next = (i + 1) % 12;
      var start = cusps[i];
      var end = cusps[next];
      if (start < end) {
        if (lon >= start && lon < end) return i + 1;
      } else {
        if (lon >= start || lon < end) return i + 1;
      }
    }
    return 1;
  }

  // ---------- SVG Transit Chart ----------

  function renderChartSVG(longitudes, cusps, aspects, ascLon) {
    var SIZE = 600;
    var CX = SIZE / 2;
    var CY = SIZE / 2;
    var R_OUTER = 272;
    var R_ZODIAC_IN = 230;
    var R_SIGN_LABEL = 251;
    var R_PLANET = 195;
    var R_INNER = 160;
    var R_CUSP_NUM = 140;
    var R_ASPECT = 100;

    // Reference angle: ASC at left (180° in math convention)
    var refLon = (typeof ascLon === 'number') ? ascLon : 0;

    function toAngle(lon) {
      return 180 - (normalizeDeg(lon) - refLon);
    }

    function polar(r, angleDeg) {
      var a = angleDeg * DEG2RAD;
      return { x: CX + r * Math.cos(a), y: CY - r * Math.sin(a) };
    }

    function arcPath(r, startDeg, endDeg) {
      var s = polar(r, startDeg);
      var e = polar(r, endDeg);
      var sweep = normalizeDeg(startDeg - endDeg);
      var large = sweep > 180 ? 1 : 0;
      return 'M ' + s.x + ' ' + s.y + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + e.x + ' ' + e.y;
    }

    function esc(s) {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    var svg = '';
    svg += '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + SIZE + ' ' + SIZE + '" class="wandering-astro-chart-svg">';

    // -- Zodiac sign ring (12 colored segments) --
    for (var si = 0; si < 12; si++) {
      var sign = ZODIAC_SIGNS[si];
      var a1 = toAngle(sign.start);
      var a2 = toAngle(sign.start + 30);
      var ec = ELEMENT_COLORS[sign.element];

      // Segment path (annular wedge)
      var o1 = polar(R_OUTER, a1);
      var o2 = polar(R_OUTER, a2);
      var i1 = polar(R_ZODIAC_IN, a1);
      var i2 = polar(R_ZODIAC_IN, a2);
      var d = 'M ' + o1.x + ' ' + o1.y;
      d += ' A ' + R_OUTER + ' ' + R_OUTER + ' 0 0 1 ' + o2.x + ' ' + o2.y;
      d += ' L ' + i2.x + ' ' + i2.y;
      d += ' A ' + R_ZODIAC_IN + ' ' + R_ZODIAC_IN + ' 0 0 0 ' + i1.x + ' ' + i1.y;
      d += ' Z';
      svg += '<path d="' + d + '" fill="' + ec.bg + '" stroke="' + ec.stroke + '" stroke-width="0.5"/>';

      // Sign symbol at midpoint
      var mid = toAngle(sign.start + 15);
      var lp = polar(R_SIGN_LABEL, mid);
      svg += '<text x="' + lp.x + '" y="' + lp.y + '" text-anchor="middle" dominant-baseline="central" font-size="16" fill="currentColor" opacity="0.8">' + esc(sign.symbol) + '</text>';
    }

    // Outer and inner circles
    svg += '<circle cx="' + CX + '" cy="' + CY + '" r="' + R_OUTER + '" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"/>';
    svg += '<circle cx="' + CX + '" cy="' + CY + '" r="' + R_ZODIAC_IN + '" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"/>';
    svg += '<circle cx="' + CX + '" cy="' + CY + '" r="' + R_INNER + '" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.2"/>';

    // -- Zodiac sign boundary lines --
    for (var bi = 0; bi < 12; bi++) {
      var ba = toAngle(bi * 30);
      var bp1 = polar(R_ZODIAC_IN, ba);
      var bp2 = polar(R_OUTER, ba);
      svg += '<line x1="' + bp1.x + '" y1="' + bp1.y + '" x2="' + bp2.x + '" y2="' + bp2.y + '" stroke="currentColor" stroke-width="0.5" opacity="0.3"/>';
    }

    // -- Degree tick marks (every 5°) --
    for (var ti = 0; ti < 72; ti++) {
      var tDeg = ti * 5;
      var ta = toAngle(tDeg);
      var tickOuter = (tDeg % 10 === 0) ? R_ZODIAC_IN : R_ZODIAC_IN;
      var tickInner = (tDeg % 10 === 0) ? R_ZODIAC_IN - 6 : R_ZODIAC_IN - 3;
      var t1 = polar(tickOuter, ta);
      var t2 = polar(tickInner, ta);
      svg += '<line x1="' + t1.x + '" y1="' + t1.y + '" x2="' + t2.x + '" y2="' + t2.y + '" stroke="currentColor" stroke-width="0.5" opacity="0.25"/>';
    }

    // -- House cusps --
    if (cusps) {
      for (var hi = 0; hi < 12; hi++) {
        var ha = toAngle(cusps[hi]);
        var isAngular = (hi === 0 || hi === 3 || hi === 6 || hi === 9);
        var hp1 = polar(R_INNER, ha);
        var hp2 = polar(R_ZODIAC_IN, ha);
        var sw = isAngular ? 1.5 : 0.7;
        var op = isAngular ? 0.6 : 0.3;
        svg += '<line x1="' + hp1.x + '" y1="' + hp1.y + '" x2="' + hp2.x + '" y2="' + hp2.y + '" stroke="currentColor" stroke-width="' + sw + '" opacity="' + op + '"/>';

        // House number
        var nextCusp = cusps[(hi + 1) % 12];
        var cuspLon = cusps[hi];
        var houseArc = normalizeDeg(nextCusp - cuspLon);
        var houseMid = normalizeDeg(cuspLon + houseArc / 2);
        var hma = toAngle(houseMid);
        var hnp = polar(R_CUSP_NUM, hma);
        svg += '<text x="' + hnp.x + '" y="' + hnp.y + '" text-anchor="middle" dominant-baseline="central" font-size="11" fill="currentColor" opacity="0.35" font-weight="600">' + (hi + 1) + '</text>';
      }

      // ASC / MC labels
      var ascA = toAngle(cusps[0]);
      var ascP = polar(R_ZODIAC_IN + 18, ascA);
      svg += '<text x="' + ascP.x + '" y="' + ascP.y + '" text-anchor="middle" dominant-baseline="central" font-size="10" fill="currentColor" opacity="0.6" font-weight="700">ASC</text>';

      var mcA = toAngle(cusps[9]);
      var mcP = polar(R_ZODIAC_IN + 18, mcA);
      svg += '<text x="' + mcP.x + '" y="' + mcP.y + '" text-anchor="middle" dominant-baseline="central" font-size="10" fill="currentColor" opacity="0.6" font-weight="700">MC</text>';
    }

    // -- Aspect lines (drawn first so planets appear on top) --
    if (aspects && aspects.length > 0) {
      var shown = Math.min(aspects.length, 15);
      for (var ai = 0; ai < shown; ai++) {
        var asp = aspects[ai];
        if (!longitudes[asp.body1] || !longitudes[asp.body2]) continue;
        var aa1 = toAngle(longitudes[asp.body1]);
        var aa2 = toAngle(longitudes[asp.body2]);
        var ap1 = polar(R_ASPECT, aa1);
        var ap2 = polar(R_ASPECT, aa2);
        var aOp = Math.max(0.15, 0.5 - parseFloat(asp.orb) * 0.05);
        var dashArray = (asp.aspect === 'Sextile') ? '4,3' : 'none';
        svg += '<line x1="' + ap1.x + '" y1="' + ap1.y + '" x2="' + ap2.x + '" y2="' + ap2.y + '" stroke="' + asp.color + '" stroke-width="1" opacity="' + aOp.toFixed(2) + '"' + (dashArray !== 'none' ? ' stroke-dasharray="' + dashArray + '"' : '') + '/>';
      }
    }

    // -- Planets --
    // Collect chart positions, handle collisions
    var planetPositions = [];
    for (var key in longitudes) {
      if (!longitudes.hasOwnProperty(key)) continue;
      var bodyInfo = null;
      for (var bi2 = 0; bi2 < ALL_BODIES.length; bi2++) {
        if (ALL_BODIES[bi2].name === key) { bodyInfo = ALL_BODIES[bi2]; break; }
      }
      if (!bodyInfo) continue;
      planetPositions.push({
        name: key,
        symbol: bodyInfo.symbol,
        lon: longitudes[key],
        chartAngle: toAngle(longitudes[key]),
        radius: R_PLANET
      });
    }

    // Sort by chart angle for collision detection
    planetPositions.sort(function (a, b) { return a.lon - b.lon; });

    // Spread overlapping planets radially
    var MIN_SEP = 8; // degrees
    for (var ci = 0; ci < planetPositions.length; ci++) {
      for (var cj = ci + 1; cj < planetPositions.length; cj++) {
        var sep = angleDiff(planetPositions[ci].lon, planetPositions[cj].lon);
        if (sep < MIN_SEP) {
          planetPositions[ci].radius = R_PLANET + 14;
          planetPositions[cj].radius = R_PLANET - 14;
        }
      }
    }

    // Draw planet symbols and position markers
    for (var pi = 0; pi < planetPositions.length; pi++) {
      var pp = planetPositions[pi];
      var pa = pp.chartAngle;

      // Small line from zodiac inner edge to planet position
      var tickStart = polar(R_ZODIAC_IN, pa);
      var tickEnd = polar(R_ZODIAC_IN - 8, pa);
      svg += '<line x1="' + tickStart.x + '" y1="' + tickStart.y + '" x2="' + tickEnd.x + '" y2="' + tickEnd.y + '" stroke="currentColor" stroke-width="1" opacity="0.5"/>';

      // Planet dot on inner edge
      var dotPos = polar(R_ZODIAC_IN - 2, pa);
      svg += '<circle cx="' + dotPos.x + '" cy="' + dotPos.y + '" r="2" fill="currentColor" opacity="0.5"/>';

      // Planet symbol
      var symPos = polar(pp.radius, pa);
      var fontSize = (pp.name === 'Sun' || pp.name === 'Moon') ? 16 : 14;
      svg += '<text x="' + symPos.x + '" y="' + symPos.y + '" text-anchor="middle" dominant-baseline="central" font-size="' + fontSize + '" fill="currentColor" opacity="0.9">' + esc(pp.symbol) + '</text>';
    }

    svg += '</svg>';
    return svg;
  }

  // ---------- Rendering ----------

  function renderAstroData(container) {
    var dateStr = container.getAttribute('data-date');
    if (!dateStr) return;

    var date = new Date(dateStr);
    if (isNaN(date.getTime())) return;

    var lat = parseFloat(container.getAttribute('data-lat'));
    var lon = parseFloat(container.getAttribute('data-lon'));
    var locationName = container.getAttribute('data-location') || '';
    var hasLocation = !isNaN(lat) && !isNaN(lon);

    try {
      // Moon phase
      var moon = getMoonPhaseData(date);

      // Moon sign
      var moonLon = getEclipticLongitude('Moon', date);
      var moonSign = getZodiacSign(moonLon);

      // Sun sign
      var sunLon = getEclipticLongitude('Sun', date);
      var sunSign = getZodiacSign(sunLon);

      // Planet positions
      var planetData = [];
      var longitudes = {};
      longitudes['Sun'] = sunLon;
      longitudes['Moon'] = moonLon;

      for (var i = 0; i < PLANETS.length; i++) {
        var p = PLANETS[i];
        var pLon = getEclipticLongitude(p.body, date);
        var sign = getZodiacSign(pLon);
        planetData.push({
          name: p.name,
          symbol: p.symbol,
          sign: sign.sign,
          signSymbol: sign.symbol,
          degree: sign.degree,
          longitude: pLon
        });
        longitudes[p.name] = pLon;
      }

      // Placidus houses
      var cusps = null;
      var sunHouse, moonHouse;
      var ascLon = 0;
      if (hasLocation) {
        cusps = calcPlacidusHouses(date, lat, lon);
        ascLon = cusps[0];
        sunHouse = getHouse(sunLon, cusps);
        moonHouse = getHouse(moonLon, cusps);
        for (var pi = 0; pi < planetData.length; pi++) {
          planetData[pi].house = getHouse(planetData[pi].longitude, cusps);
        }
      }

      // Aspects
      var aspects = findAspects(longitudes);

      // Build HTML
      var html = '';
      html += '<h3 class="wandering-astro-title">Celestial Transits</h3>';
      var subtitle = 'Positions for ' + date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      if (locationName) {
        subtitle += ' \u2014 ' + locationName;
      }
      html += '<p class="wandering-astro-date">' + subtitle + '</p>';

      // Transit chart wheel
      html += '<div class="wandering-astro-card wandering-astro-chart-card">';
      html += '<div class="wandering-astro-card-header">Transit Chart</div>';
      html += '<div class="wandering-astro-chart-wrap">';
      html += renderChartSVG(longitudes, cusps, aspects, hasLocation ? ascLon : 0);
      html += '</div></div>';

      // Moon phase card
      html += '<div class="wandering-astro-card wandering-astro-moon">';
      html += '<div class="wandering-astro-card-header">Moon Phase</div>';
      html += '<div class="wandering-astro-moon-display">';
      html += '<span class="wandering-astro-moon-emoji">' + moon.emoji + '</span>';
      html += '<div class="wandering-astro-moon-info">';
      html += '<strong>' + moon.name + '</strong><br>';
      html += moon.illumination + '% illuminated<br>';
      html += 'Moon in ' + moonSign.symbol + ' ' + moonSign.sign + ' ' + formatDegree(moonSign.degree);
      if (hasLocation) {
        html += ' <span class="wandering-astro-house-badge">House ' + moonHouse + '</span>';
      }
      html += '</div></div></div>';

      // Sun sign card
      html += '<div class="wandering-astro-card wandering-astro-sun">';
      html += '<div class="wandering-astro-card-header">Sun Sign</div>';
      html += '<div class="wandering-astro-body-row">';
      html += '<span class="wandering-astro-body-symbol">\u2609</span>';
      html += '<span>Sun in ' + sunSign.symbol + ' ' + sunSign.sign + ' ' + formatDegree(sunSign.degree);
      if (hasLocation) {
        html += ' <span class="wandering-astro-house-badge">House ' + sunHouse + '</span>';
      }
      html += '</span></div></div>';

      // Planets card
      html += '<div class="wandering-astro-card wandering-astro-planets">';
      html += '<div class="wandering-astro-card-header">Planetary Positions</div>';
      for (var j = 0; j < planetData.length; j++) {
        var pd = planetData[j];
        html += '<div class="wandering-astro-body-row">';
        html += '<span class="wandering-astro-body-symbol">' + pd.symbol + '</span>';
        html += '<span class="wandering-astro-body-name">' + pd.name + '</span>';
        html += '<span class="wandering-astro-body-pos">' + pd.signSymbol + ' ' + pd.sign + ' ' + formatDegree(pd.degree);
        if (hasLocation && pd.house) {
          html += ' <span class="wandering-astro-house-badge">H' + pd.house + '</span>';
        }
        html += '</span></div>';
      }
      html += '</div>';

      // House cusps card
      if (hasLocation && cusps) {
        html += '<div class="wandering-astro-card wandering-astro-houses">';
        html += '<div class="wandering-astro-card-header">Placidus Houses</div>';
        for (var h = 0; h < 12; h++) {
          var cuspSign = getZodiacSign(cusps[h]);
          html += '<div class="wandering-astro-house-row">';
          html += '<span class="wandering-astro-house-num">House ' + (h + 1) + '</span>';
          html += '<span class="wandering-astro-house-cusp">' + cuspSign.symbol + ' ' + cuspSign.sign + ' ' + formatDegree(cuspSign.degree) + '</span>';
          html += '</div>';
        }
        html += '</div>';
      }

      // Aspects card
      if (aspects.length > 0) {
        html += '<div class="wandering-astro-card wandering-astro-aspects">';
        html += '<div class="wandering-astro-card-header">Key Aspects</div>';
        var shown = Math.min(aspects.length, 12);
        for (var a = 0; a < shown; a++) {
          var asp = aspects[a];
          html += '<div class="wandering-astro-aspect-row">';
          html += '<span class="wandering-astro-aspect-dot" style="background:' + asp.color + '"></span>';
          html += '<span class="wandering-astro-aspect-bodies">' + asp.body1 + ' ' + asp.symbol + ' ' + asp.body2 + '</span>';
          html += '<span class="wandering-astro-aspect-name">' + asp.aspect + '</span>';
          html += '<span class="wandering-astro-aspect-orb">(orb ' + asp.orb + '\u00B0)</span>';
          html += '</div>';
        }
        html += '</div>';
      }

      container.innerHTML = html;
      container.classList.add('wandering-astro-loaded');

    } catch (err) {
      container.innerHTML = '<p class="wandering-astro-error">Unable to calculate astronomical data.</p>';
      if (typeof console !== 'undefined') {
        console.error('Wandering Astro error:', err);
      }
    }
  }

  function init() {
    var containers = document.querySelectorAll('.wandering-astro-data');
    for (var i = 0; i < containers.length; i++) {
      renderAstroData(containers[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
