"""Edge Pydantic model matching the database schema."""

from pydantic import BaseModel


class Edge(BaseModel):
    id: int
    from_node: str
    to_node: str
    weight: float = 1.0
    is_accessible: bool = True
