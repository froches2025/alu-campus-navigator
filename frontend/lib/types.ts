export interface Node {
  id: string;
  building_id: string;
  name: string;
  floor: number;
  type:
    | "room"
    | "corridor"
    | "staircase"
    | "elevator"
    | "facility"
    | "pod"
    | "entrance"
    | "utility"
    | "common_area";
  x: number;
  y: number;
  aliases: string[];
}

export interface Edge {
  from_node: string;
  to_node: string;
  weight: number;
}

export interface NavigationRequest {
  from_node: string;
  to_node: string;
}

export interface NavigationResponse {
  success: boolean;
  path: string[];
  total_weight: number;
  directions: string[];
}

export interface Building {
  id: string;
  name: string;
  short_name: string;
  floors: number[];
}

export interface ResolveResponse {
  success: boolean;
  node_id: string | null;
  node_name: string | null;
  confidence: string;
  query: string;
}
