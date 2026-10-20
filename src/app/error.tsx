"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="container-x flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-3xl font-extrabold">Something went wrong</h1>
      <p className="text-muted">Please try again. If it keeps happening, message us on WhatsApp.</p>
      <button type="button" className="btn btn-dark" onClick={reset}>Try again</button>
    </main>
  );
}
