export default function Loading() {
  return (
    <main className="min-h-screen px-3 py-4 sm:px-6" style={{ background: "var(--app-bg)", color: "var(--text-strong)" }}>
      <div className="mx-auto grid w-full max-w-7xl gap-4">
        <div className="h-14 rounded-2xl" style={{ background: "var(--surface)" }} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="h-32 animate-pulse rounded-2xl" key={index} style={{ background: "var(--surface)" }} />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-2xl" style={{ background: "var(--surface)" }} />
      </div>
    </main>
  );
}
