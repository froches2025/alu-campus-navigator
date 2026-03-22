"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { navigate, getNodes } from "@/lib/api";
import type { NavigationResponse, Node } from "@/lib/types";
import MapView from "@/components/MapView";
import FloorSwitcher from "@/components/FloorSwitcher";
import DirectionsPanel from "@/components/DirectionsPanel";

function NavigateContent() {
  const params = useSearchParams();
  const router = useRouter();
  const fromNode = params.get("from_node") ?? "";
  const toNode = params.get("to_node") ?? "";

  const [result, setResult] = useState<NavigationResponse | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [floor, setFloor] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromName, setFromName] = useState("");
  const [toName, setToName] = useState("");

  useEffect(() => {
    if (!fromNode || !toNode) {
      router.replace("/");
      return;
    }

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [navResult, ...floorNodes] = await Promise.all([
          navigate(fromNode, toNode),
          getNodes("social-commons", 0),
          getNodes("social-commons", 1),
          getNodes("social-commons", 2),
        ]);
        const allNodes = [floorNodes[0], floorNodes[1], floorNodes[2]].flat();

        // Resolve names before setting result so route summary renders with names
        const nodeMap = new Map(allNodes.map((n) => [n.id, n.name]));
        setFromName(nodeMap.get(fromNode) ?? "");
        setToName(nodeMap.get(toNode) ?? "");
        setNodes(allNodes);
        setResult(navResult);

        // Auto-switch to the floor where the path starts
        if (navResult.path.length > 0) {
          const startNode = allNodes.find((n) => n.id === navResult.path[0]);
          if (startNode) setFloor(startNode.floor);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to get directions.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [fromNode, toNode, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#8B0000] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Calculating route...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-[#2a2a2a] rounded-2xl p-8 text-center">
          <div className="w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-[#8B0000] text-xl">!</span>
          </div>
          <h2 className="text-white font-semibold text-lg mb-2">Could not get directions</h2>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block bg-[#8B0000] hover:bg-[#a00000] text-white font-medium px-6 py-3 rounded-lg text-sm transition-colors"
          >
            ← Start Over
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      {/* Header */}
      <header className="bg-[#8B0000] px-4 py-3 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-[#8B0000] font-black text-xs">ALU</span>
          </div>
          <span className="text-white font-semibold text-sm">Campus Navigator</span>
        </div>
        <Link
          href="/"
          className="text-red-200 hover:text-white text-sm font-medium transition-colors"
        >
          ← Start Over
        </Link>
      </header>

      {/* Route summary */}
      {result && (
        <div className="bg-[#2a2a2a] border-b border-gray-800 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="text-sm">
              <span className="text-gray-500">From </span>
              <span className="text-white font-medium">{fromName || fromNode}</span>
              <span className="text-gray-500"> to </span>
              <span className="text-white font-medium">{toName || toNode}</span>
            </div>
            <div className="text-gray-500 text-xs">
              {result.directions.length} steps · weight {result.total_weight}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 px-4 py-5 max-w-3xl mx-auto w-full space-y-4">
        {/* Floor switcher */}
        <FloorSwitcher current={floor} onChange={setFloor} />

        {/* Map */}
        <MapView
          floor={floor}
          nodes={nodes}
          path={result?.path ?? []}
        />

        {/* Directions */}
        {result && <DirectionsPanel directions={result.directions} />}
      </div>
    </div>
  );
}

export default function NavigatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-[#8B0000] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <NavigateContent />
    </Suspense>
  );
}
