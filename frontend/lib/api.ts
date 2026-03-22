import type { NavigationResponse, Node, ResolveResponse } from "./types";

function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  return `${base}${path}`;
}

export async function getNodes(building: string, floor: number): Promise<Node[]> {
  const params = new URLSearchParams({ building, floor: String(floor) });
  const res = await fetch(apiUrl(`/nodes?${params}`));
  if (!res.ok) {
    throw new Error(`Failed to fetch nodes: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.nodes as Node[];
}

export async function navigate(
  from_node: string,
  to_node: string
): Promise<NavigationResponse> {
  const res = await fetch(apiUrl("/navigate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from_node, to_node }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      error.detail ?? `Navigation request failed: ${res.status} ${res.statusText}`
    );
  }
  return res.json() as Promise<NavigationResponse>;
}

export async function resolveQuery(query: string): Promise<ResolveResponse> {
  const res = await fetch(apiUrl("/resolve"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      error.detail ?? `Resolve request failed: ${res.status} ${res.statusText}`
    );
  }
  return res.json() as Promise<ResolveResponse>;
}
