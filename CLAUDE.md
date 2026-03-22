# Campus Navigator - Claude Code Context

## What This Project Is
An indoor navigation web app for African Leadership University (ALU) Kigali campus.
Users search for a room or space, pick a starting point, and get a visual path drawn
over the real building floor plan. Think Google Maps, but for inside the campus buildings.

The app solves a real problem: ALU's campus has multiple buildings and floors with
rooms named after African countries (Egypt, Morocco, Algeria, Ethiopia, Djibouti,
South Sudan). New students and visitors regularly get lost.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + React |
| Styling | Tailwind CSS |
| Map Rendering | SVG overlay on floor plan images |
| Backend | FastAPI (Python 3.11+) |
| Database | PostgreSQL with psycopg2 |
| Auth | Supabase Auth (JWT) |
| AI Layer | Anthropic Claude API (natural language room search) |
| Deployment | Vercel (frontend) + Railway (backend) |

---

## Project Structure

```
campus-navigator/
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Home: search bar + building selector
│   │   ├── navigate/
│   │   │   └── page.tsx          # Main navigation view
│   │   └── admin/
│   │       └── page.tsx          # Admin: manage rooms and edges
│   ├── components/
│   │   ├── MapView/
│   │   │   ├── index.tsx         # SVG overlay container
│   │   │   ├── FloorPlan.tsx     # Background floor plan image
│   │   │   ├── NodeLayer.tsx     # Renders room dots on SVG
│   │   │   └── PathLine.tsx      # Animated highlighted path
│   │   ├── Search/
│   │   │   ├── SearchBar.tsx     # Natural language input
│   │   │   └── Suggestions.tsx   # Dropdown room suggestions
│   │   ├── FloorSwitcher.tsx     # Toggle between floors 0, 1, 2
│   │   └── DirectionsPanel.tsx   # Step-by-step text directions
│   ├── lib/
│   │   ├── api.ts                # API client (fetch wrappers)
│   │   └── types.ts              # Shared TypeScript types
│   └── public/
│       └── floorplans/
│           ├── sc-floor-0.jpg    # Social Commons ground floor
│           ├── sc-floor-1.jpg    # Social Commons first floor
│           └── sc-floor-2.jpg    # Social Commons second floor
│
├── backend/
│   ├── main.py                   # FastAPI app entry point
│   ├── routes/
│   │   ├── navigation.py         # POST /navigate - pathfinding
│   │   ├── nodes.py              # GET /nodes - list rooms
│   │   ├── buildings.py          # GET /buildings - building info
│   │   └── auth.py               # Auth middleware
│   ├── services/
│   │   ├── pathfinder.py         # Dijkstra's algorithm
│   │   └── ai_resolver.py        # Claude API: NL -> node_id
│   ├── models/
│   │   ├── node.py               # Node pydantic model
│   │   ├── edge.py               # Edge pydantic model
│   │   └── navigation.py         # Request/response models
│   └── db/
│       ├── connection.py         # PostgreSQL connection pool
│       └── seed.py               # Load seed_data.json into DB
│
├── database/
│   └── schema.sql                # All CREATE TABLE statements
│
├── seed_data.json                # Campus graph data (source of truth)
└── CLAUDE.md                     # This file
```

---

## Database Schema

```sql
-- Buildings
CREATE TABLE buildings (
  id TEXT PRIMARY KEY,           -- e.g. "social-commons"
  name TEXT NOT NULL,            -- e.g. "Social Commons"
  short_name TEXT NOT NULL       -- e.g. "SC"
);

-- Nodes (rooms, corridors, stairs, etc.)
CREATE TABLE nodes (
  id TEXT PRIMARY KEY,           -- e.g. "SC-G-EGYPT"
  building_id TEXT REFERENCES buildings(id),
  name TEXT NOT NULL,            -- e.g. "Egypt Learning Lab"
  floor INTEGER NOT NULL,        -- 0, 1, or 2
  type TEXT NOT NULL,            -- room | corridor | staircase | elevator | facility | pod | entrance | utility | common_area
  x FLOAT NOT NULL,              -- normalized 0-100 coordinate
  y FLOAT NOT NULL,              -- normalized 0-100 coordinate
  aliases TEXT[]                 -- searchable alternate names
);

-- Edges (connections between nodes)
CREATE TABLE edges (
  id SERIAL PRIMARY KEY,
  from_node TEXT REFERENCES nodes(id),
  to_node TEXT REFERENCES nodes(id),
  weight FLOAT DEFAULT 1.0,      -- traversal cost (higher = slower)
  is_accessible BOOLEAN DEFAULT TRUE  -- for future accessibility routing
);

-- Users (managed by Supabase Auth, mirrored here)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'student'    -- student | admin
);
```

---

## Core Concepts

### Node ID Convention
`{BUILDING_SHORT}-{FLOOR}-{ROOM_CODE}`
- `SC` = Social Commons, `LC` = Learning Commons, `EC` = Enterprise Commons
- `G` = Ground, `1` = First Floor, `2` = Second Floor
- Examples: `SC-G-EGYPT`, `SC-1-MOROCCO`, `SC-2-DJIBOUTI`

### Coordinate System
Nodes have x/y coordinates on a 0-100 normalized grid relative to each floor's
floor plan image. (0,0) is top-left. These are used to position SVG elements
over the floor plan image in the frontend.

When rendering: `pixel_x = (node.x / 100) * image_width`

### Pathfinding
Uses Dijkstra's algorithm implemented in `backend/services/pathfinder.py`.
The graph is loaded into memory at startup from the database.
Cross-floor paths go through staircase or elevator nodes, which have higher
weights (3 for stairs, 2 for elevator) to reflect time cost.

### AI Room Resolution
When a user types a natural language query like "where do I write my exam"
or "I need a quiet pod for an online class", the query goes to Claude API
before pathfinding. Claude returns the most likely `node_id` from the known
node list. If Claude cannot resolve it confidently, it returns `null` and
the frontend falls back to fuzzy text search on node names and aliases.

The system prompt for AI resolution is in `backend/services/ai_resolver.py`.

---

## API Endpoints

### POST /navigate
Find path between two nodes.
```json
// Request
{
  "from_node": "SC-G-ENT-A",
  "to_node": "SC-2-DJIBOUTI"
}

// Response
{
  "path": ["SC-G-ENT-A", "SC-G-CORRIDOR", "SC-G-STAIRS-A", "SC-1-STAIRS-A", "SC-2-STAIRS-A", "SC-2-CORRIDOR", "SC-2-DJIBOUTI"],
  "total_weight": 14,
  "directions": [
    "Enter through Main Entrance A",
    "Walk through the Ground Floor Corridor",
    "Take Staircase A up to the first floor",
    "Continue up Staircase A to the second floor",
    "Walk down the Second Floor Corridor",
    "Djibouti Learning Lab is on your right"
  ]
}
```

### GET /nodes?building=social-commons&floor=0
Returns all nodes for a given building and floor.

### POST /resolve
AI-powered natural language to node_id resolution.
```json
// Request
{ "query": "where is the food court" }

// Response
{ "node_id": "SC-G-FOODCOURT", "confidence": "high", "floor": 0 }
```

---

## Current Data: Social Commons Only
The app launches with Social Commons data only (3 floors).
Learning Commons and Enterprise Commons will be added in a later sprint
using the same data structure. No code changes needed to add new buildings,
only new rows in the database seeded from an updated seed_data.json.

---

## Key Conventions
- Python: use type hints everywhere, Pydantic models for all request/response bodies
- TypeScript: strict mode on, no `any` types
- All API responses include a top-level `success: bool` field
- Environment variables are never hardcoded; use `.env.local` (frontend) and `.env` (backend)
- Floor plan images live in `frontend/public/floorplans/` named `{building-id}-floor-{n}.jpg`

---

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/campus_nav
ANTHROPIC_API_KEY=
SUPABASE_JWT_SECRET=
```

---

## What's Been Done (Pre-Code)
- [x] Campus mapped: Social Commons, all 3 floors
- [x] All nodes identified and named
- [x] All edges defined with weights
- [x] Seed data JSON complete (seed_data.json)
- [x] Schema designed

## What To Build Next (In Order)
1. Database setup + seed script
2. FastAPI backend with pathfinding
3. AI resolver service
4. Next.js frontend with map view
5. Search + directions UI
6. Auth (student login, admin panel)
7. Deploy
