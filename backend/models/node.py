"""Node Pydantic model matching the database schema."""

from pydantic import BaseModel


class Node(BaseModel):
    id: str
    building_id: str
    name: str
    floor: int
    type: str
    x: float
    y: float
    aliases: list[str] = []
