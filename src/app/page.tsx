"use client";

import dynamic from "next/dynamic";

const CircuitEditor = dynamic(() => import("@/components/CircuitEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-[#f8fafc] dark:bg-[#090b10]" />
  ),
});

export default function Home() {
  return <CircuitEditor />;
}
