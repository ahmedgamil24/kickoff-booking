export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center">
        <h1 className="text-3xl font-bold text-white">Page not found</h1>
        <p className="mt-2 text-slate-400">The page you requested does not exist.</p>
      </div>
    </main>
  );
}
