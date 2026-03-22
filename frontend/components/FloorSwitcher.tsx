const FLOORS = [
  { value: 0, label: "G", fullLabel: "Ground" },
  { value: 1, label: "1", fullLabel: "First" },
  { value: 2, label: "2", fullLabel: "Second" },
];

interface FloorSwitcherProps {
  current: number;
  onChange: (floor: number) => void;
}

export default function FloorSwitcher({ current, onChange }: FloorSwitcherProps) {
  return (
    <div className="flex items-center gap-1 bg-[#2a2a2a] rounded-xl p-1.5">
      <span className="text-gray-500 text-xs font-semibold px-2">Floor</span>
      {FLOORS.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            current === f.value
              ? "bg-[#8B0000] text-white shadow"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
          title={`${f.fullLabel} Floor`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
