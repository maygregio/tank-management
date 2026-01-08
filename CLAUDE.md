# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
npm start        # Start production server
```

## Architecture Overview

This is a Next.js 14 (App Router) **frontend application** for managing Carbon Black Oil tanks. It tracks tank volumes, oil properties (API gravity, sulfur content, etc.), and movements between tanks.

**Note**: The backend API is hosted separately. Set `NEXT_PUBLIC_API_URL` to point to your backend.

### Core Domain Concepts

- **Tanks**: Storage containers with current volume (kilo barrels) and properties
- **Movements**: Three types - `receive` (incoming oil), `ship` (outgoing), `transfer` (between tanks)
- **Movement Completion**: Determined by the `date` field - if set, movement is completed; if null, it's scheduled
- **Properties**: Dynamic, user-defined measurements (e.g., API, Sulfur, Viscosity) with units
- **Volume-weighted blending**: When oil is added to a tank, properties are calculated as weighted averages

### Data Flow

```
Client Components → Hooks (React Query) → dataService → External Backend API
```

### Data Fetching (TanStack Query)

All data fetching uses TanStack Query (React Query) with the following hooks:
- `useTanks()` / `useTank(id)` - Tank queries and mutations
- `useMovements(tankId?)` - Movement queries and mutations
- `useProperties()` - Property definition queries and mutations
- `useAuditLog(entityType?, entityId?)` - Audit log queries

Query keys are defined in each hook file (e.g., `tankKeys`, `movementKeys`). Mutations automatically invalidate related queries - movement mutations also invalidate tanks since they affect volumes.

### Key Services

- `src/services/dataService.ts` - Client-side API abstraction layer for all CRUD operations
- `src/services/tankCalculations.ts` - Volume-weighted property blending and projection calculations (client-side)

## Environment Variables

```
NEXT_PUBLIC_API_URL=https://your-backend-api.com   # Backend API URL (required)
```

## Validation Rules

- Volume must be > 0 for movements
- Tank and property names must be unique (case-insensitive)
- Completed movements (with `date` set) apply volume changes to tanks
