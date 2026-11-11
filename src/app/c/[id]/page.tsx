"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

const CircuitEditor = dynamic(() => import("@/components/CircuitEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-[#f8fafc] dark:bg-[#090b10]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        <p className="text-xs font-mono text-zinc-400">Loading shared circuit...</p>
      </div>
    </div>
  ),
});

export default function SharedCircuitPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  return <CircuitEditor viewerProjectId={id} />;
}
