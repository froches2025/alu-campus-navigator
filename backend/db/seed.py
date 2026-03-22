"""
Seed script: reads seed_data.json from the project root and inserts
buildings, nodes, and edges into PostgreSQL. Idempotent — safe to run
multiple times without duplicating data.

Usage:
    python backend/db/seed.py
"""

import json
import os
import sys
from pathlib import Path

import psycopg2
from psycopg2.extras import execute_values

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://campus_nav_user:campus_nav_pass@localhost:5432/campus_nav",
)

# seed_data.json lives at the project root (two levels up from this file)
SEED_FILE = Path(__file__).resolve().parents[2] / "seed_data.json"


def load_seed_data() -> dict:
    if not SEED_FILE.exists():
        print(f"ERROR: seed file not found at {SEED_FILE}", file=sys.stderr)
        sys.exit(1)
    with open(SEED_FILE, "r") as f:
        return json.load(f)


def seed_buildings(cur: psycopg2.extensions.cursor, buildings: list[dict]) -> None:
    if not buildings:
        return
    execute_values(
        cur,
        """
        INSERT INTO buildings (id, name, short_name)
        VALUES %s
        ON CONFLICT (id) DO UPDATE
            SET name = EXCLUDED.name,
                short_name = EXCLUDED.short_name
        """,
        [(b["id"], b["name"], b["short_name"]) for b in buildings],
    )
    print(f"  Upserted {len(buildings)} building(s).")


def seed_nodes(cur: psycopg2.extensions.cursor, nodes: list[dict]) -> None:
    if not nodes:
        return
    execute_values(
        cur,
        """
        INSERT INTO nodes (id, building_id, name, floor, type, x, y, aliases)
        VALUES %s
        ON CONFLICT (id) DO UPDATE
            SET building_id = EXCLUDED.building_id,
                name        = EXCLUDED.name,
                floor       = EXCLUDED.floor,
                type        = EXCLUDED.type,
                x           = EXCLUDED.x,
                y           = EXCLUDED.y,
                aliases     = EXCLUDED.aliases
        """,
        [
            (
                n["id"],
                n["building_id"],
                n["name"],
                n["floor"],
                n["type"],
                n["x"],
                n["y"],
                n.get("aliases") or [],
            )
            for n in nodes
        ],
    )
    print(f"  Upserted {len(nodes)} node(s).")


def seed_edges(cur: psycopg2.extensions.cursor, edges: list[dict]) -> None:
    if not edges:
        return
    # Edges have no natural unique key in the schema, so we delete and re-insert
    # to stay idempotent without requiring a unique constraint on (from_node, to_node).
    cur.execute("DELETE FROM edges")
    execute_values(
        cur,
        """
        INSERT INTO edges (from_node, to_node, weight, is_accessible)
        VALUES %s
        """,
        [
            (
                e["from_node"],
                e["to_node"],
                e.get("weight", 1.0),
                e.get("is_accessible", True),
            )
            for e in edges
        ],
    )
    print(f"  Inserted {len(edges)} edge(s).")


def main() -> None:
    data = load_seed_data()

    buildings: list[dict] = data.get("buildings", [])
    nodes: list[dict] = data.get("nodes", [])
    edges: list[dict] = data.get("edges", [])

    print(f"Connecting to database…")
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False

    try:
        with conn.cursor() as cur:
            print("Seeding buildings…")
            seed_buildings(cur, buildings)

            print("Seeding nodes…")
            seed_nodes(cur, nodes)

            print("Seeding edges…")
            seed_edges(cur, edges)

        conn.commit()
        print("Done. All data committed successfully.")
    except Exception as exc:
        conn.rollback()
        print(f"ERROR: {exc}", file=sys.stderr)
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
