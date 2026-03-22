"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getNodes, resolveQuery } from "@/lib/api";
import type { Node } from "@/lib/types";

const BUILDINGS = [{ id: "social-commons", name: "Social Commons" }];
const FLOORS = [
  { value: 0, label: "Ground Floor" },
  { value: 1, label: "First Floor" },
  { value: 2, label: "Second Floor" },
];

type SearchMode = "name" | "ai";

export default function Home() {
  const router = useRouter();
  const [building, setBuilding] = useState("social-commons");
  const [floor, setFloor] = useState(0);
  const [allNodes, setAllNodes] = useState<Node[]>([]);
  const [fromNode, setFromNode] = useState("");

  // "Search by name" mode state
  const [toNode, setToNode] = useState("");
  const [destQuery, setDestQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Node[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // "Ask AI" mode state
  const [searchMode, setSearchMode] = useState<SearchMode>("name");
  const [aiQuery, setAiQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiFound, setAiFound] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Load nodes from all floors when building changes
  useEffect(() => {
    async function loadNodes() {
      try {
        const results = await Promise.all(
          FLOORS.map((f) => getNodes(building, f.value))
        );
        setAllNodes(results.flat());
      } catch {
        // Backend not available — continue with empty node list
      }
    }
    loadNodes();
  }, [building]);

  // Filter destination suggestions (name mode)
  useEffect(() => {
    if (!destQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const q = destQuery.toLowerCase();
    const matched = allNodes
      .filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          n.id.toLowerCase().includes(q) ||
          n.aliases.some((a) => a.toLowerCase().includes(q))
      )
      .slice(0, 8);
    setSuggestions(matched);
  }, [destQuery, allNodes]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Element)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const floorNodes = allNodes.filter((n) => n.floor === floor);

  function selectDestination(node: Node) {
    setToNode(node.id);
    setDestQuery(node.name);
    setShowSuggestions(false);
  }

  function switchMode(mode: SearchMode) {
    setSearchMode(mode);
    setError("");
    setAiFound(null);
    setToNode("");
    setDestQuery("");
    setAiQuery("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!fromNode) {
      setError("Please select your starting location.");
      return;
    }

    if (searchMode === "name") {
      if (!toNode) {
        setError("Please select a destination.");
        return;
      }
      if (fromNode === toNode) {
        setError("Start and destination are the same.");
        return;
      }
      setLoading(true);
      router.push(
        `/navigate?from_node=${encodeURIComponent(fromNode)}&to_node=${encodeURIComponent(toNode)}`
      );
    } else {
      // AI mode: resolve the natural language query first
      if (!aiQuery.trim()) {
        setError("Please describe where you want to go.");
        return;
      }
      setLoading(true);
      try {
        const result = await resolveQuery(aiQuery.trim());
        if (!result.node_id) {
          setError(
            "Could not find that location. Try searching by name instead."
          );
          setLoading(false);
          return;
        }
        if (fromNode === result.node_id) {
          setError("You're already there! Choose a different destination.");
          setLoading(false);
          return;
        }
        // Show confirmation for 1.5 s before navigating
        setAiFound(result.node_name ?? result.node_id);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        router.push(
          `/navigate?from_node=${encodeURIComponent(fromNode)}&to_node=${encodeURIComponent(result.node_id)}`
        );
      } catch {
        setError("AI search failed. Try searching by name instead.");
        setAiFound(null);
        setLoading(false);
      }
    }
  }

  return (
    <main className="min-h-screen bg-[#1a1a1a] flex flex-col">
      {/* Header */}
      <header className="bg-[#8B0000] px-6 py-4 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-[#8B0000] font-black text-xs">ALU</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-xl leading-tight">Campus Navigator</h1>
            <p className="text-red-200 text-xs">African Leadership University · Kigali</p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-b from-[#8B0000] to-[#1a1a1a] px-6 py-12 text-center">
        <h2 className="text-white text-3xl font-bold mb-2">Find your way around campus</h2>
        <p className="text-red-200 text-sm">Enter your destination and starting point to get directions</p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-[#2a2a2a] rounded-2xl shadow-2xl p-6 space-y-5">

            {/* Building selector */}
            <div>
              <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Building
              </label>
              <select
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="w-full bg-[#1a1a1a] text-white border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000]"
              >
                {BUILDINGS.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Destination: mode toggle + input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  Where are you going?
                </label>
                {/* Mode toggle */}
                <div className="flex bg-[#1a1a1a] rounded-lg p-0.5 border border-gray-700">
                  <button
                    type="button"
                    onClick={() => switchMode("name")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      searchMode === "name"
                        ? "bg-[#8B0000] text-white"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    Search by name
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode("ai")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      searchMode === "ai"
                        ? "bg-[#8B0000] text-white"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    Ask AI
                  </button>
                </div>
              </div>

              {searchMode === "name" ? (
                /* Name search with suggestions dropdown */
                <div ref={searchRef} className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Egypt Learning Lab, Morocco..."
                    value={destQuery}
                    onChange={(e) => {
                      setDestQuery(e.target.value);
                      setToNode("");
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full bg-[#1a1a1a] text-white border border-gray-700 rounded-lg px-4 py-3 text-sm placeholder-gray-600 focus:outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000]"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-[#2a2a2a] border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                      {suggestions.map((node) => (
                        <li key={node.id}>
                          <button
                            type="button"
                            onClick={() => selectDestination(node)}
                            className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#8B0000]/20 flex items-center gap-3"
                          >
                            <span className="w-2 h-2 rounded-full bg-[#8B0000] flex-shrink-0" />
                            <div>
                              <div className="font-medium">{node.name}</div>
                              <div className="text-gray-500 text-xs">
                                Floor {node.floor === 0 ? "G" : node.floor} · {node.type}
                              </div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                /* AI free-text input */
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. where do I write my exam? or I need a quiet spot for an online class"
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      className="w-full bg-[#1a1a1a] text-white border border-[#8B0000]/50 rounded-lg px-4 py-3 text-sm placeholder-gray-600 focus:outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B0000] text-xs font-semibold">
                      AI
                    </span>
                  </div>
                  <p className="text-gray-600 text-xs mt-1.5">
                    Describe the space in plain English — Claude will find it for you.
                  </p>
                </div>
              )}
            </div>

            {/* Floor selector */}
            <div>
              <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Your current floor
              </label>
              <div className="flex gap-2">
                {FLOORS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFloor(f.value)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      floor === f.value
                        ? "bg-[#8B0000] text-white"
                        : "bg-[#1a1a1a] text-gray-400 border border-gray-700 hover:border-gray-500"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Starting location */}
            <div>
              <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Where are you now?
              </label>
              <select
                value={fromNode}
                onChange={(e) => setFromNode(e.target.value)}
                className="w-full bg-[#1a1a1a] text-white border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000]"
              >
                <option value="">Select your starting point...</option>
                {floorNodes.map((node) => (
                  <option key={node.id} value={node.id}>{node.name}</option>
                ))}
                {floorNodes.length === 0 && (
                  <option disabled>No locations loaded — is the backend running?</option>
                )}
              </select>
            </div>

            {aiFound && (
              <div className="text-green-300 text-sm bg-green-900/20 border border-green-800/50 rounded-lg px-4 py-2.5 flex items-center gap-2">
                <span className="text-green-400 flex-shrink-0">✓</span>
                <span>
                  AI found: <span className="font-semibold">{aiFound}</span> — navigating...
                </span>
              </div>
            )}

            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 border border-red-900/50 rounded-lg px-4 py-2.5 flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">!</span>
                <span>
                  {error}
                  {error.includes("Try searching by name") && (
                    <button
                      type="button"
                      onClick={() => switchMode("name")}
                      className="ml-1 underline hover:text-red-300"
                    >
                      Switch now
                    </button>
                  )}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8B0000] hover:bg-[#a00000] disabled:opacity-50 text-white font-semibold py-3.5 rounded-lg text-sm transition-colors shadow-lg"
            >
              {loading
                ? searchMode === "ai"
                  ? "Asking AI..."
                  : "Getting directions..."
                : "Get Directions →"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
