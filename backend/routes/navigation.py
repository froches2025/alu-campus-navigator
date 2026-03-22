"""Navigation routes: POST /navigate and GET /nodes."""

from typing import Optional

from fastapi import APIRouter, HTTPException

from backend.models.navigation import (
    NavigationRequest,
    NavigationResponse,
    NodesResponse,
    ResolveRequest,
    ResolveResponse,
)
from backend.services import ai_resolver
from backend.models.node import Node
from backend.services import pathfinder
from backend.db.connection import get_connection

router = APIRouter()


@router.post("/navigate", response_model=NavigationResponse)
def navigate(request: NavigationRequest) -> NavigationResponse:
    if pathfinder.get_node(request.from_node) is None:
        raise HTTPException(status_code=404, detail=f"Node not found: {request.from_node}")
    if pathfinder.get_node(request.to_node) is None:
        raise HTTPException(status_code=404, detail=f"Node not found: {request.to_node}")

    result = pathfinder.dijkstra(request.from_node, request.to_node)
    if result is None:
        raise HTTPException(status_code=404, detail="No path found between the given nodes.")

    path_ids, total_weight = result
    path_nodes: list[Node] = [pathfinder.get_node(nid) for nid in path_ids]  # type: ignore[misc]
    directions = pathfinder.generate_directions(path_nodes)

    return NavigationResponse(
        success=True,
        path=path_ids,
        total_weight=total_weight,
        directions=directions,
    )


@router.get("/nodes", response_model=NodesResponse)
def list_nodes(
    building: Optional[str] = None,
    floor: Optional[int] = None,
) -> NodesResponse:
    filters: list[str] = []
    params: list[object] = []

    if building is not None:
        filters.append("building_id = %s")
        params.append(building)
    if floor is not None:
        filters.append("floor = %s")
        params.append(floor)

    where = ("WHERE " + " AND ".join(filters)) if filters else ""
    query = f"SELECT id, building_id, name, floor, type, x, y, aliases FROM nodes {where}"

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            rows = cur.fetchall()

    nodes = [
        {
            "id": row[0],
            "building_id": row[1],
            "name": row[2],
            "floor": row[3],
            "type": row[4],
            "x": row[5],
            "y": row[6],
            "aliases": row[7] or [],
        }
        for row in rows
    ]

    return NodesResponse(success=True, nodes=nodes)


@router.post("/resolve", response_model=ResolveResponse)
def resolve(request: ResolveRequest) -> ResolveResponse:
    # Fetch all nodes across all floors to give Claude full context
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, building_id, name, floor, type, x, y, aliases FROM nodes"
            )
            rows = cur.fetchall()

    nodes = [
        {
            "id": row[0],
            "building_id": row[1],
            "name": row[2],
            "floor": row[3],
            "type": row[4],
            "x": row[5],
            "y": row[6],
            "aliases": row[7] or [],
        }
        for row in rows
    ]

    result = ai_resolver.resolve_query(request.query, nodes)

    node_id = result["node_id"]
    node_name: str | None = None
    if node_id:
        matched = next((n for n in nodes if n["id"] == node_id), None)
        node_name = matched["name"] if matched else None

    return ResolveResponse(
        success=True,
        node_id=node_id,
        node_name=node_name,
        confidence=result["confidence"],
        query=request.query,
    )
