export function DashboardHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-zinc-800/80 bg-zinc-950/80 px-4 backdrop-blur-xl md:px-6">
      <div className="relative min-w-0 max-w-xl flex-1">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-zinc-500" />
        <input
          type="search"
          placeholder="Search orders, products, customers…"
          className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900/80 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-zinc-500 focus:bg-zinc-900"
          aria-label="Search"
        />
      </div>
      <div className="hidden items-center gap-2 sm:flex">
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          aria-label="Notifications"
        >
          <BellIcon className="size-[18px]" />
        </button>
        <button
          type="button"
          className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
        >
          Export
        </button>
      </div>
    </header>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.082A2.02 2.02 0 0 0 21 16.016V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10.016a2.02 2.02 0 0 0 1.087 1.082 23.848 23.848 0 0 0 5.454 1.082 2.02 2.02 0 0 0 2.01-1.082A2.02 2.02 0 0 0 12 20.016a2.02 2.02 0 0 0 2.01 1.082 2.02 2.02 0 0 0 2.01-1.082Z" />
    </svg>
  );
}
