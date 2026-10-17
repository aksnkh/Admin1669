# Admin1669 development

Use the existing checkout. Do not create a Git worktree unless explicitly requested.

This is a Persian RTL React/TypeScript application built with Vite. API contracts are in README.md and src/api. Use the standalone PwaApi1669 contracts, not legacy Api endpoints. Never hardcode tokens or user credentials. Keep demo data and demo mode clearly separate from real API operations.

Install with npm ci; validate with npm test and npm run build. For UI or API flow changes also run npm run test:e2e after building (Chromium installed, CHROMIUM_PATH optional). Tests use mocked APIs and must not write to live databases.

Build output is dist, ignored by Git. Deploy the complete output folder. public/config.js is runtime public configuration copied to dist/config.js. Keep relative assets and HashRouter for static subfolder hosting. Preserve RTL layout, keyboard access and mobile responsiveness. Backend referral contract is POST Orders/refDataEntryForMobile with { id, ref_tech } returning Response<bool>; real backend deployment must be verified separately.
