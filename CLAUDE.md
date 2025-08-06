# DnD Encounters 24 - Project Overview

## Project Type
- React application 
- Azure Static Web App with auto-deployment
- Auto-deploys on push to `main` branch via GitHub Actions

## Structure
- **Frontend**: React app in `src/`
- **Build Output**: `build/` directory
- **Deployment**: Azure Static Web Apps (workflow: `.github/workflows/azure-static-web-apps-green-mud-0d844ea00.yml`)

## Key Files
- `src/App.js` - Main application logic
- `src/cr_xp.json` - Challenge Rating to XP mapping
- `src/enc_by_cr.json` - Encounters organized by Challenge Rating
- `src/enc_xp.json` - Encounter XP values
- `src/spend_enc_xp.js` - XP spending logic

## Commands
- `npm start` - Development server
- `npm run build` - Build for production
- `npm test` - Run tests

## Notes
- Changes to encounter logic will be in the React components and data files
- Deployment is automatic when pushing to main branch