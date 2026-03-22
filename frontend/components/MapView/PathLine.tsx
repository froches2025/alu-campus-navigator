import type { Node } from "@/lib/types";

interface PathLineProps {
  path: string[];
  nodes: Node[];
}

export default function PathLine({ path, nodes }: PathLineProps) {
  if (path.length < 2) return null;

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const points = path
    .map((id) => nodeMap.get(id))
    .filter((n): n is Node => n !== undefined);

  if (points.length < 2) return null;

  // Coordinates are in 0-100 viewBox units, used directly (no %)
  const pointsStr = points.map((n) => `${n.x},${n.y}`).join(" ");

  return (
    <g>
      {/* Shadow/glow */}
      <polyline
        points={pointsStr}
        fill="none"
        stroke="#8B0000"
        strokeWidth="2"
        strokeOpacity="0.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Main path line */}
      <polyline
        points={pointsStr}
        fill="none"
        stroke="#8B0000"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="3 1.5"
        style={{ animation: "dash 1.5s linear infinite" }}
      />
      {/* Start marker */}
      <circle
        cx={points[0].x}
        cy={points[0].y}
        r="3"
        fill="#22c55e"
        stroke="white"
        strokeWidth="0.6"
      />
      {/* End marker */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="3"
        fill="#8B0000"
        stroke="white"
        strokeWidth="0.6"
      />
      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: -9; }
        }
      `}</style>
    </g>
  );
}
