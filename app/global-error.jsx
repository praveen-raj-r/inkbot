"use client";

import { useEffect } from "react";

// Catches errors thrown by the root layout itself (app/layout.js) — the
// one place error.jsx can't reach, since error.jsx is rendered inside its
// segment's layout, not around it. Kept dependency-free (no Tailwind
// classes, no shared components) since if the root layout is what threw,
// its providers may not be in a usable state either.
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "#fff",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: 420 }}>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "0.75rem",
            }}
          >
            Something went wrong
          </h1>
          <p style={{ color: "#94a3b8", marginBottom: "1.5rem" }}>
            The app hit an unexpected error. Try reloading the page.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#7c3aed",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.6rem 1.4rem",
              cursor: "pointer",
              fontSize: "0.95rem",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
