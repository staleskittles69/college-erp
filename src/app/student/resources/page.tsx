export default function ResourcesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Resources</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Study materials and library resources.</p>
      </div>
      <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 p-12 flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-500 dark:text-gray-400">No resources available yet.</p>
      </div>
    </div>
  );
}
