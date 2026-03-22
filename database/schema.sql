-- Campus Navigator Database Schema

-- Buildings
CREATE TABLE IF NOT EXISTS buildings (
  id TEXT PRIMARY KEY,           -- e.g. "social-commons"
  name TEXT NOT NULL,            -- e.g. "Social Commons"
  short_name TEXT NOT NULL       -- e.g. "SC"
);

-- Nodes (rooms, corridors, stairs, etc.)
CREATE TABLE IF NOT EXISTS nodes (
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
CREATE TABLE IF NOT EXISTS edges (
  id SERIAL PRIMARY KEY,
  from_node TEXT REFERENCES nodes(id),
  to_node TEXT REFERENCES nodes(id),
  weight FLOAT DEFAULT 1.0,      -- traversal cost (higher = slower)
  is_accessible BOOLEAN DEFAULT TRUE  -- for future accessibility routing
);

-- Users (managed by Supabase Auth, mirrored here)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'student'    -- student | admin
);
