"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Catches errors anywhere under the root layout that don't have a more
// specific error.jsx of their own (landing page, auth pages, the public
// feed/profile/post pages). app/dashboard/error.jsx handles the
// dashboard shell separately so the sidebar stays visible on crash there.
export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-6">
      <div className="text-center max-w-md space-y-4">
        <AlertTriangle className="size-10 text-red-400 mx-auto" />
        <h1 className="text-2xl font-bold gradient-text-primary">
          Something went wrong
        </h1>
        <p className="text-slate-400">
          {error?.message || "An unexpected error occurred."}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="primary" onClick={() => reset()}>
            Try again
          </Button>
          <Link href="/">
            <Button variant="outline">Go home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
