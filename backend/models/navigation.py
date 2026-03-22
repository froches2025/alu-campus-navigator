"""Request/response Pydantic models for navigation endpoints."""

from pydantic import BaseModel


class NavigationRequest(BaseModel):
    from_node: str
    to_node: str


class NavigationResponse(BaseModel):
    success: bool
    path: list[str]
    total_weight: float
    directions: list[str]


class NodesResponse(BaseModel):
    success: bool
    nodes: list[dict]


class ResolveRequest(BaseModel):
    query: str


class ResolveResponse(BaseModel):
    success: bool
    node_id: str | None
    node_name: str | None
    confidence: str
    query: str
