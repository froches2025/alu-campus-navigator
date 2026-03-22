interface DirectionsPanelProps {
  directions: string[];
}

export default function DirectionsPanel({ directions }: DirectionsPanelProps) {
  if (directions.length === 0) {
    return (
      <div className="bg-[#2a2a2a] rounded-xl p-5 text-gray-500 text-sm text-center">
        No directions available.
      </div>
    );
  }

  return (
    <div className="bg-[#2a2a2a] rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-800">
        <h3 className="text-white font-semibold text-sm">Step-by-step directions</h3>
        <p className="text-gray-500 text-xs mt-0.5">{directions.length} steps</p>
      </div>
      <ol className="divide-y divide-gray-800">
        {directions.map((step, i) => (
          <li
            key={i}
            className={`flex items-start gap-4 px-5 py-4 ${
              i === 0 ? "bg-[#8B0000]/10" : "hover:bg-white/5"
            } transition-colors`}
          >
            <div
              className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                i === 0
                  ? "bg-[#8B0000] text-white"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm leading-snug ${
                  i === 0 ? "text-white font-medium" : "text-gray-300"
                }`}
              >
                {step}
              </p>
              {i === 0 && (
                <p className="text-[#8B0000] text-xs mt-1 font-medium">You are here</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
