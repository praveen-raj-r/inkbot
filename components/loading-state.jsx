"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Full-section "still loading" gate — the block that used to be hand-copied
// (with drifting spinner styles: Loader2 in some places, a raw
// animate-spin div in others, min-h-96 vs min-h-screen) at the top of
// nearly every page in the app.
export default function LoadingState({ message = "Loading...", className = "" }) {
  return (
    <div className={cn("flex items-center justify-center min-h-96", className)}>
      <div className="text-center">
        <Loader2 className="size-8 animate-spin text-purple-400 mx-auto" />
        <p className="text-slate-400 mt-4">{message}</p>
      </div>
    </div>
  );
}
