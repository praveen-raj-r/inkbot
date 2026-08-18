"use client";

import { cn } from "@/lib/utils";

// "Nothing here yet" content block. Deliberately unopinionated about its
// wrapper (plain container vs. a Card) since that varies by where it's
// used — callers wrap it in a Card themselves when they need one. `icon`
// takes a ready-made element (a lucide icon, an emoji span, ...) rather
// than a component reference, so callers keep control of its styling.
export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}) {
  return (
    <div className={cn("text-center", className)}>
      {icon && <div className="mb-4 flex justify-center">{icon}</div>}
      {title && <h3 className="text-lg font-medium text-white mb-2">{title}</h3>}
      {description && <p className="text-slate-400 mb-6">{description}</p>}
      {action}
    </div>
  );
}
