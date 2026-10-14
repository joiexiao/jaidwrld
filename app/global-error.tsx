"use client";
// app/global-error.tsx — error boundary GLOBAL (level root).
// Fungsi: menangkap error yang tak tertangkap error.tsx biasa, termasuk error di root layout.
// Wajib "use client" dan WAJIB merender <html> & <body> sendiri (menggantikan root layout).
// Isi: UI error paling luar + tombol reset. Style inline karena globals.css belum tentu termuat.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
          Something went wrong
        </h2>
        {error.digest ? (
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "0.75rem",
              opacity: 0.6,
            }}
          >
            {error.digest}
          </p>
        ) : null}
        <button
          onClick={() => reset()}
          style={{
            borderRadius: "9999px",
            padding: "0.5rem 1.25rem",
            border: "1px solid currentColor",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
