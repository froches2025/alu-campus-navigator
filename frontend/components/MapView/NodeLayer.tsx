import type { Node } from "@/lib/types";

const TYPE_COLORS: Record<Node["type"], string> = {
  room: "#3b82f6",
  corridor: "#6b7280",
  staircase: "#f97316",
  elevator: "#a855f7",
  facility: "#22c55e",
  pod: "#eab308",
  entrance: "#ef4444",
  utility: "#78716c",
  common_area: "#14b8a6",
};

interface NodeLayerProps {
  nodes: Node[];
  path: string[];
}

export default function NodeLayer({ nodes, path }: NodeLayerProps) {
  const pathSet = new Set(path);
  // Show labels for path nodes only (start and end are always in path)
  const showLabel = (id: string) => pathSet.has(id);

  return (
    <g>
      {nodes.map((node) => {
        const inPath = pathSet.has(node.id);
        const color = TYPE_COLORS[node.type] ?? "#6b7280";
        const cx = node.x;
        const cy = node.y;
        const r = 1.8;

        return (
          <g key={node.id}>
            {/* Glow ring for path nodes */}
            {inPath && (
              <circle
                cx={cx}
                cy={cy}
                r={r + 2}
                fill={color}
                fillOpacity={0.2}
              />
            )}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={color}
              stroke={inPath ? "white" : "rgba(255,255,255,0.2)"}
              strokeWidth={inPath ? 0.5 : 0.3}
              className="cursor-pointer"
            >
              {/* Tooltip for all nodes (shown on hover by SVG title) */}
              <title>{node.name} · {node.type}</title>
            </circle>
            {/* Visible label only for nodes on the active path */}
            {showLabel(node.id) && (
              <text
                x={cx}
                y={cy + r + 5}
                textAnchor="middle"
                fontSize={2.8}
                fontFamily="sans-serif"
                fontWeight="600"
                fill="white"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {node.name}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
