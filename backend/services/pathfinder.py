"""
Dijkstra's algorithm for campus pathfinding.

Graph is loaded from the database at startup and kept in memory.
Edges are treated as bidirectional.
"""

import heapq
from collections import defaultdict

from backend.db.connection import get_connection
from backend.models.node import Node

# In-memory graph: node_id -> list of (neighbour_id, weight)
_graph: dict[str, list[tuple[str, float]]] = defaultdict(list)
# In-memory node lookup: node_id -> Node
_nodes: dict[str, Node] = {}


def load_graph() -> None:
    """Load all nodes and edges from the database into memory."""
    global _graph, _nodes
    _graph = defaultdict(list)
    _nodes = {}

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, building_id, name, floor, type, x, y, aliases FROM nodes"
            )
            for row in cur.fetchall():
                node = Node(
                    id=row[0],
                    building_id=row[1],
                    name=row[2],
                    floor=row[3],
                    type=row[4],
                    x=row[5],
                    y=row[6],
                    aliases=row[7] or [],
                )
                _nodes[node.id] = node

            cur.execute("SELECT from_node, to_node, weight FROM edges")
            for from_node, to_node, weight in cur.fetchall():
                # Bidirectional
                _graph[from_node].append((to_node, weight))
                _graph[to_node].append((from_node, weight))


def get_node(node_id: str) -> Node | None:
    return _nodes.get(node_id)


def dijkstra(from_id: str, to_id: str) -> tuple[list[str], float] | None:
    """
    Run Dijkstra's algorithm between two node IDs.
    Returns (path, total_weight) or None if no path exists.
    """
    if from_id not in _nodes or to_id not in _nodes:
        return None

    dist: dict[str, float] = {from_id: 0.0}
    prev: dict[str, str | None] = {from_id: None}
    heap: list[tuple[float, str]] = [(0.0, from_id)]

    while heap:
        cost, current = heapq.heappop(heap)
        if cost > dist.get(current, float("inf")):
            continue
        if current == to_id:
            break
        for neighbour, weight in _graph.get(current, []):
            new_cost = cost + weight
            if new_cost < dist.get(neighbour, float("inf")):
                dist[neighbour] = new_cost
                prev[neighbour] = current
                heapq.heappush(heap, (new_cost, neighbour))

    if to_id not in dist:
        return None

    # Reconstruct path
    path: list[str] = []
    step: str | None = to_id
    while step is not None:
        path.append(step)
        step = prev.get(step)
    path.reverse()

    return path, dist[to_id]


_FLOOR_NAMES = {0: "Ground Floor", 1: "First Floor", 2: "Second Floor"}


def _floor_label(floor: int) -> str:
    return _FLOOR_NAMES.get(floor, f"Floor {floor}")


def generate_directions(path: list[Node]) -> list[str]:
    """Produce human-readable step-by-step directions from an ordered list of nodes."""
    if not path:
        return []

    directions: list[str] = []

    for i, node in enumerate(path):
        # First node: entry point
        if i == 0:
            if node.type == "entrance":
                directions.append(f"Enter through {node.name}.")
            else:
                directions.append(f"Start at {node.name}.")
            continue

        prev = path[i - 1]

        # Floor change via staircase
        if node.type == "staircase":
            # Collapse consecutive staircase nodes with the same name into one
            # direction — only emit when the run ends (next node is different).
            if prev.type == "staircase" and prev.name == node.name:
                continue
            # Look ahead to find where this staircase run ends
            run_end = node
            for j in range(i + 1, len(path)):
                if path[j].type == "staircase" and path[j].name == node.name:
                    run_end = path[j]
                else:
                    break
            destination_floor = run_end.floor
            if destination_floor > node.floor or (
                prev.type == "staircase" and destination_floor > prev.floor
            ):
                directions.append(
                    f"Take {node.name} up to the {_floor_label(destination_floor)}."
                )
            elif destination_floor < node.floor or (
                prev.type == "staircase" and destination_floor < prev.floor
            ):
                directions.append(
                    f"Take {node.name} down to the {_floor_label(destination_floor)}."
                )
            else:
                directions.append(f"Pass through {node.name}.")
            continue

        # Floor change via elevator
        if node.type == "elevator":
            if i + 1 < len(path):
                next_node = path[i + 1]
                if next_node.floor != node.floor:
                    direction = "up" if next_node.floor > node.floor else "down"
                    directions.append(
                        f"Take the {node.name} {direction} to the {_floor_label(next_node.floor)}."
                    )
                else:
                    directions.append(f"Pass through {node.name}.")
            else:
                directions.append(f"Arrive at {node.name}.")
            continue

        # Corridor / utility / common_area: "walk through"
        if node.type in ("corridor", "utility", "common_area"):
            directions.append(f"Walk through {node.name}.")
            continue

        # Last node: destination
        if i == len(path) - 1:
            if node.type in ("room", "pod", "facility"):
                directions.append(f"{node.name} is on your right.")
            else:
                directions.append(f"Arrive at {node.name}.")
            continue

        # Default: walk to
        directions.append(f"Walk to {node.name}.")

    return directions
