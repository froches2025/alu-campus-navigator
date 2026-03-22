# ALU Campus Navigator

> An AI-powered indoor navigation system for the African Leadership University campus in Kigali, Rwanda.

Students and visitors at ALU regularly get lost navigating buildings where rooms are named after African countries — Egypt, Morocco, Djibouti, South Sudan. Campus Navigator solves this by letting users search naturally ("where do I write my exam?") and get a visual, step-by-step path drawn directly on the real floor plan.

---

## Table of Contents

- [Demo](#demo)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Campus Data](#campus-data)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Demo

> _Demo link and screenshots will be added once the MVP is deployed._

**Core user flow:**

1. Open the app and select your starting point (e.g. "Main Entrance A")
2. Type where you want to go — in plain English or a room name
3. The AI resolves your query to a known room node
4. Dijkstra's algorithm finds the shortest path through the building graph
5. The path is drawn as an animated overlay on the real floor plan
6. Step-by-step directions appear in the side panel

---

## Features

**Navigation**
- Visual path rendering over real ALU floor plan images
- Shortest-path calculation using Dijkstra's algorithm
- Floor switching — navigate across Ground, First, and Second floors
- Step-by-step turn-by-turn directions in plain language

**AI-Powered Search**
- Natural language room resolution via the Claude API
- Ask things like "where is the dean's office?" or "I need a quiet pod"
- Falls back gracefully to fuzzy text search if the AI cannot confidently resolve a query

**Auth & Roles**
- Student login via Supabase Auth (JWT)
- Admin panel for managing rooms, corridors, and graph edges
- Role-based access: students navigate, admins edit campus data

**Data & Performance**
- Campus graph stored in PostgreSQL with nodes and weighted edges
- Graph loaded into memory at server startup for fast pathfinding
- Seed data driven from a single `seed_data.json` source of truth — adding a new building requires no code changes

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + React |
| Styling | Tailwind CSS |
| Map Rendering | SVG overlay on floor plan images |
| Backend | FastAPI (Python 3.11+) |
| Database | PostgreSQL + psycopg2 |
| Auth | Supabase Auth (JWT) |
| AI Layer | Anthropic Claude API |
| Deployment | Vercel (frontend) + Railway (backend) |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Next.js Frontend                  │
│   SearchBar → AI Resolver → MapView → PathLine SVG   │
└────────────────────────┬────────────────────────────┘
                         │ HTTP (REST)
┌────────────────────────▼────────────────────────────┐
│                   FastAPI Backend                    │
│  /navigate  /nodes  /resolve  /buildings  /auth      │
│                                                      │
│   ┌─────────────────┐    ┌──────────────────────┐   │
│   │  Pathfinder     │    │   AI Resolver         │   │
│   │  (Dijkstra)     │    │  (Claude API)         │   │
│   └────────┬────────┘    └──────────────────────┘   │
│            │                                         │
│   ┌────────▼────────────────────────────────────┐   │
│   │           PostgreSQL Database               │   │
│   │   buildings | nodes | edges | users         │   │
│   └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

The backend loads the full campus graph into memory on startup. Navigation requests never hit the database — pathfinding runs on the in-memory graph. Only admin write operations and auth touch the database at request time.

---

## Project Structure

```
campus-navigator/
├── frontend/
│   ├── app/
│   │   ├── page.tsx                  # Home: search bar + building selector
│   │   ├── navigate/
│   │   │   └── page.tsx              # Main navigation view
│   │   └── admin/
│   │       └── page.tsx              # Admin: manage rooms and edges
│   ├── components/
│   │   ├── MapView/
│   │   │   ├── index.tsx             # SVG overlay container
│   │   │   ├── FloorPlan.tsx         # Background floor plan image
│   │   │   ├── NodeLayer.tsx         # Renders room dots on SVG
│   │   │   └── PathLine.tsx          # Animated highlighted path
│   │   ├── Search/
│   │   │   ├── SearchBar.tsx         # Natural language input
│   │   │   └── Suggestions.tsx       # Dropdown room suggestions
│   │   ├── FloorSwitcher.tsx         # Toggle between floors 0, 1, 2
│   │   └── DirectionsPanel.tsx       # Step-by-step text directions
│   ├── lib/
│   │   ├── api.ts                    # API client (fetch wrappers)
│   │   └── types.ts                  # Shared TypeScript types
│   └── public/
│       └── floorplans/
│           ├── sc-floor-0.jpg        # Social Commons ground floor
│           ├── sc-floor-1.jpg        # Social Commons first floor
│           └── sc-floor-2.jpg        # Social Commons second floor
│
├── backend/
│   ├── main.py                       # FastAPI app entry point
│   ├── routes/
│   │   ├── navigation.py             # POST /navigate
│   │   ├── nodes.py                  # GET /nodes
│   │   ├── buildings.py              # GET /buildings
│   │   └── auth.py                   # Auth middleware
│   ├── services/
│   │   ├── pathfinder.py             # Dijkstra's algorithm
│   │   └── ai_resolver.py            # Claude API: NL → node_id
│   ├── models/
│   │   ├── node.py
│   │   ├── edge.py
│   │   └── navigation.py
│   └── db/
│       ├── connection.py             # PostgreSQL connection pool
│       └── seed.py                   # Load seed_data.json into DB
│
├── database/
│   └── schema.sql                    # All CREATE TABLE statements
│
├── seed_data.json                    # Campus graph data (source of truth)
├── CLAUDE.md                         # Claude Code context file
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL (running locally or via a cloud provider)
- An [Anthropic API key](https://console.anthropic.com/)
- A [Supabase](https://supabase.com/) project (for auth)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/your-username/campus-navigator.git
cd campus-navigator
```

**2. Set up the backend**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows WSL: source venv/bin/activate
pip install -r requirements.txt
```

**3. Set up the database**

```bash
# Create the database
createdb campus_nav

# Run the schema
psql campus_nav < database/schema.sql

# Seed campus data
python db/seed.py
```

**4. Set up the frontend**

```bash
cd ../frontend
npm install
```

### Environment Variables

**Backend — `backend/.env`**

```env
DATABASE_URL=postgresql://user:password@localhost:5432/campus_nav
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
```

**Frontend — `frontend/.env.local`**

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Running Locally

**Start the backend:**

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Start the frontend (in a separate terminal):**

```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## API Reference

### `POST /navigate`

Find the shortest path between two nodes.

**Request**
```json
{
  "from_node": "SC-G-ENT-A",
  "to_node": "SC-2-DJIBOUTI"
}
```

**Response**
```json
{
  "success": true,
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

---

### `POST /resolve`

Resolve a natural language query to a node ID using the Claude API.

**Request**
```json
{
  "query": "where is the food court"
}
```

**Response**
```json
{
  "success": true,
  "node_id": "SC-G-FOODCOURT",
  "confidence": "high",
  "floor": 0
}
```

Returns `node_id: null` when the query cannot be confidently resolved. The frontend falls back to fuzzy text search in this case.

---

### `GET /nodes`

List all nodes for a building and floor.

**Query params:** `building` (string), `floor` (integer)

**Example:** `GET /nodes?building=social-commons&floor=0`

---

### `GET /buildings`

List all buildings and their available floors.

---

## Database Schema

```sql
CREATE TABLE buildings (
  id    TEXT PRIMARY KEY,   -- e.g. "social-commons"
  name  TEXT NOT NULL,
  floors INTEGER NOT NULL
);

CREATE TABLE nodes (
  id          TEXT PRIMARY KEY,   -- e.g. "SC-G-DJIBOUTI"
  building_id TEXT REFERENCES buildings(id),
  floor       INTEGER NOT NULL,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,      -- room | corridor | staircase | entrance | toilet
  x           FLOAT,              -- SVG coordinate (% of floor plan width)
  y           FLOAT,              -- SVG coordinate (% of floor plan height)
  aliases     TEXT[]              -- alternate names for AI resolution
);

CREATE TABLE edges (
  id          SERIAL PRIMARY KEY,
  from_node   TEXT REFERENCES nodes(id),
  to_node     TEXT REFERENCES nodes(id),
  weight      INTEGER NOT NULL DEFAULT 1,
  bidirectional BOOLEAN DEFAULT TRUE
);
```

Node IDs follow the convention `{BUILDING}-{FLOOR}-{ROOM}`, e.g. `SC-G-ENT-A` (Social Commons, Ground floor, Entrance A) or `SC-2-DJIBOUTI` (Social Commons, 2nd floor, Djibouti).

---

## Campus Data

The `seed_data.json` file is the single source of truth for all campus graph data. It defines buildings, nodes (rooms, corridors, staircases, entrances), and weighted edges.

**Current coverage:**

| Building | Status | Floors |
|---|---|---|
| Social Commons | Complete | G, 1, 2 |
| Learning Commons | Planned | G, 1, 2 |
| Enterprise Commons | Planned | G, 1, 2 |

Adding a new building requires only adding entries to `seed_data.json` and re-running `python db/seed.py`. No code changes are needed.

---

## Deployment

**Frontend (Vercel)**

```bash
cd frontend
vercel --prod
```

Set environment variables in the Vercel dashboard under Project Settings > Environment Variables.

**Backend (Railway)**

Connect your GitHub repository to Railway and set the following environment variables in the Railway dashboard:

```
DATABASE_URL       (Railway auto-provisions this if you add a PostgreSQL plugin)
ANTHROPIC_API_KEY
SUPABASE_JWT_SECRET
```

The backend Procfile or start command:

```
uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

## Roadmap

- [x] Campus graph defined for Social Commons (all 3 floors)
- [x] Seed data schema and JSON structure finalized
- [ ] PostgreSQL schema and seed script
- [ ] Dijkstra pathfinding service
- [ ] FastAPI routes: `/navigate`, `/nodes`, `/resolve`
- [ ] AI room resolver (Claude API integration)
- [ ] Next.js frontend with SVG map overlay
- [ ] Search bar with NL input + suggestions
- [ ] Step-by-step directions panel
- [ ] Floor switcher
- [ ] Supabase auth (student login + admin roles)
- [ ] Admin panel (CRUD for rooms and edges)
- [ ] Learning Commons data + integration
- [ ] Enterprise Commons data + integration
- [ ] Mobile responsiveness polish
- [ ] Deployment (Vercel + Railway)

---

## Contributing

This project is currently being built as a portfolio project. If you're an ALU student and want to contribute campus data for Learning Commons or Enterprise Commons, open an issue or reach out directly.

**To contribute data:**

1. Fork the repo
2. Add your building/floor nodes and edges to `seed_data.json`
3. Follow the existing node ID convention: `{BUILDING-CODE}-{FLOOR}-{ROOM}`
4. Open a pull request with a description of what you mapped

---

## License

MIT License. See [LICENSE](./LICENSE) for details.

---

_Built by a student at the African Leadership University, for the ALU community._