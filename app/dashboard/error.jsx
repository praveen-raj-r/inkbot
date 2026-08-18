"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

// error.jsx renders inside app/dashboard/layout.jsx, not around it, so
// the sidebar and top bar stay mounted and only this content area is
// replaced when a dashboard page throws.
export default function DashboardError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-96 p-4 lg:p-8">
      <div className="text-center max-w-md space-y-4">
        <AlertTriangle className="size-10 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">This page hit an error</h2>
        <p className="text-slate-400">
          {error?.message || "Something went wrong loading this section."}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="primary" onClick={() => reset()}>
            Try again
          </Button>
          <Link href="/dashboard">
            <Button variant="outline">Back to dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
