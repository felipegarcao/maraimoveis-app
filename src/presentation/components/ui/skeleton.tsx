import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("relative overflow-hidden rounded-md bg-slate-200/70", className)}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}

export function SkeletonCardImovel() {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface shadow-soft">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-14" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTabela({ linhas = 5, colunas = 4 }: { linhas?: number; colunas?: number }) {
  return (
    <div className="divide-y divide-line">
      {Array.from({ length: linhas }).map((_, linha) => (
        <div key={linha} className="flex items-center gap-4 px-4 py-4">
          {Array.from({ length: colunas }).map((__, coluna) => (
            <Skeleton
              key={coluna}
              className={cn("h-4", coluna === 0 ? "w-1/3" : "hidden flex-1 sm:block")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonIndicadores({ quantidade = 4 }: { quantidade?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: quantidade }).map((_, i) => (
        <div key={i} className="rounded-card border border-line bg-surface p-4 shadow-soft">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-7 w-28" />
          <Skeleton className="mt-3 h-3 w-16" />
        </div>
      ))}
    </div>
  );
}
