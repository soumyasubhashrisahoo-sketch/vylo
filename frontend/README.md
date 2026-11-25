# Vylo — Safety-First Navigation & GPS Hub (React + Vite)

A one-to-one port of the original single-file `vylo_safety_first_navigation_gps_hub.html` into a React project.
Markup, Tailwind classes, CSS, and all application logic are unchanged.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build -> dist/
npm run preview    # serve the production build
```

Node 18+ required. Open it on `localhost` or `https` — browsers only allow GPS (geolocation) on secure origins.

## API keys

The original app uses **no API keys**; every service it calls is free and keyless, so there is nothing to configure:

| Purpose                          | Service                                   |
| -------------------------------- | ----------------------------------------- |
| Routing (safest / fastest paths) | OSRM — `router.project-osrm.org`          |
| Place search / autocomplete      | Photon (Komoot) — `photon.komoot.io`      |
| Reverse geocoding                | Nominatim (OSM) — `nominatim.openstreetmap.org` |
| Cameras, police, hospitals, lamps, shops, transit | Overpass API — `overpass-api.de` |
| IP-based location fallback       | `ipapi.co` and `ipwho.is`                 |
| Map tiles (Night / Street / Satellite) | Esri ArcGIS tile servers            |
| Ride / SOS hand-off links        | Uber, Ola, Rapido, WhatsApp (`wa.me`), Google Maps pin |

Open-source libraries (installed from npm instead of CDN): **Leaflet 1.9.4**, **Tailwind CSS 3.4.17**, **React 18**, **Vite 5**.
Fonts (Inter, JetBrains Mono) still load from Google Fonts in `index.html`.

## Structure

```
index.html                 fonts + <body> classes (unchanged)
src/
  main.jsx                 entry (Leaflet CSS, global CSS, mounts <App/>)
  App.jsx                  layout + starts the app once on mount
  index.css                original <style> block, verbatim, + Tailwind directives
  components/              original markup, one component per section/modal
    Header, RoutesPanel, MapPanel, SafetyPanel, PanicPanel,
    CloserLookModal, RateRouteModal, MetroMapModal, GpsHelpModal, ToastContainer
  legacy/vyloApp.js        original <script>, verbatim (routing, GPS, safety score, SOS, metro, ...)
```

## What changed vs. the HTML (wiring only)

- Tailwind and Leaflet come from npm instead of CDN `<script>`/`<link>` tags (same versions / same engine).
- `class` → `className`, inline `onclick`/`oninput` → React `onClick`/`onInput` calling the same functions; `value`/`checked` → `defaultValue`/`defaultChecked` so inputs stay editable.
- The `DOMContentLoaded` listener became `startVylo()`, called once after React mounts.
- Functions and `APP_STATE` are exposed on `window` (as in a classic script) so the original inline handlers and generated HTML keep working.
