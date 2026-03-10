# NEXUS-MD Session Generator

## Overview
NEXUS-MD is a WhatsApp session pairing web application that allows users to generate session credentials via pair code or QR scan. The app features a premium dark UI with gold/cyan gradients, animated particle background, and live statistics dashboard.

## Project Architecture
- **voltah.js** - Main Express server with stats API, routes, and middleware
- **pair.js** - Pair code generation route using Baileys library
- **qr.js** - QR code generation route using Baileys library
- **id.js** - Random ID generator utility
- **main.html** - Landing page with stats dashboard, deploy platforms, and particle effects
- **pair.html** - Advanced pair code page with step progress, particle canvas, tips, security info
- **stats.json** - Auto-generated statistics file (gitignored)

## Key Features
- Live statistics dashboard (8 stat cards: total sessions, success rate, countries, etc.)
- Deploy platform buttons: Heroku, Render, CypherX Platform, Panel (Bot Hosting), Replit, Daki.cc
- Animated particle canvas background with connecting lines on both pages
- Advanced pair page with 3-step progress indicator, animated progress bar, tips section
- Security strip showing encryption and privacy info
- Responsive design for mobile/desktop
- Statistics tracking API (/api/stats)

## Deployment Files
- **Procfile** - Heroku deployment config
- **render.yaml** - Render deployment config
- **app.json** - Heroku one-click deploy config

## Deployment Platforms Supported
- Heroku (one-click deploy button)
- Render (render.yaml + deploy button)
- CypherX Platform (platform.cypherx.space)
- Panel / Bot Hosting (Pterodactyl-based)
- Replit (import from GitHub)
- Daki.cc (cloud hosting)

## Tech Stack
- Node.js 20+ / Express
- Baileys (WhatsApp Web API)
- Vanilla HTML/CSS/JS frontend
- Font Awesome icons, Google Fonts (Space Grotesk, Syne, JetBrains Mono)

## Running
- Default port: 5000 (configurable via PORT env var)
- Start command: `node voltah.js`

## Session Prefix
- Sessions are prefixed with `NEXUS-MD:~` (base64 encoded credentials)
- Pair code custom key: `NEXUSBOT`

## Recent Changes
- 2026-03-10: Rebranded from JUNE-X to NEXUS-MD throughout all files
- 2026-03-10: Complete premium UI redesign — gold/cyan/purple palette, Space Grotesk + Syne fonts, glassmorphism cards, grid overlay background
- 2026-03-10: Updated session string prefix from JUNE-MD to NEXUS-MD in qr.js and pair.js
- 2026-03-10: Updated pairing custom code from JUNEXBOT to NEXUSBOT
