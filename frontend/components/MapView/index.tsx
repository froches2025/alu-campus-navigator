import type { Node } from "@/lib/types";
import NodeLayer from "./NodeLayer";
import PathLine from "./PathLine";

const FLOOR_LABELS: Record<number, string> = {
  0: "Ground Floor",
  1: "First Floor",
  2: "Second Floor",
};

interface MapViewProps {
  floor: number;
  nodes: Node[];
  path: string[];
}

export default function MapView({ floor, nodes, path }: MapViewProps) {
  const floorNodes = nodes.filter((n) => n.floor === floor);
  const floorPath = path.filter((id) =>
    floorNodes.some((n) => n.id === id)
  );

  return (
    <div className="relative w-full bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-800">
      {/* Floor plan placeholder — replaced with real images later */}
      <svg
        viewBox="0 0 100 100"
        className="w-full"
        style={{ aspectRatio: "4/3" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background */}
        <rect width="100" height="100" fill="#111827" />

        {/* Grid lines */}
        {Array.from({ length: 11 }, (_, i) => i * 10).map((v) => (
          <g key={v}>
            <line
              x1={v}
              y1={0}
              x2={v}
              y2={100}
              stroke="#1f2937"
              strokeWidth="0.3"
            />
            <line
              x1={0}
              y1={v}
              x2={100}
              y2={v}
              stroke="#1f2937"
              strokeWidth="0.3"
            />
          </g>
        ))}

        {/* Building outline */}
        <rect
          x="5"
          y="5"
          width="90"
          height="90"
          fill="none"
          stroke="#374151"
          strokeWidth="0.8"
          rx="1"
        />

        {/* Subtle corner labels — low opacity, don't interfere with nodes */}
        <text
          x="7"
          y="11"
          fontSize="4"
          fontFamily="sans-serif"
          fill="white"
          fillOpacity="0.3"
          style={{ userSelect: "none" }}
        >
          Social Commons
        </text>
        <text
          x="7"
          y="95"
          fontSize="4"
          fontFamily="sans-serif"
          fill="white"
          fillOpacity="0.3"
          style={{ userSelect: "none" }}
        >
          {FLOOR_LABELS[floor] ?? `Floor ${floor}`}
        </text>

        {/* Path and nodes rendered on top */}
        <PathLine path={floorPath} nodes={floorNodes} />
        <NodeLayer nodes={floorNodes} path={floorPath} />
      </svg>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 flex flex-wrap gap-x-3 gap-y-1">
        {[
          { color: "#22c55e", label: "Start" },
          { color: "#8B0000", label: "End" },
          { color: "#3b82f6", label: "Room" },
          { color: "#f97316", label: "Stairs" },
          { color: "#a855f7", label: "Elevator" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-gray-300 text-xs">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
