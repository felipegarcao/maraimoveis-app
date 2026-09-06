import { Skeleton, SkeletonCardImovel } from "@/presentation/components/ui";

export default function CarregandoVitrine() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Skeleton className="h-10 w-3/4 max-w-lg" />
      <Skeleton className="mt-4 h-5 w-full max-w-md" />
      <Skeleton className="mt-8 h-36 w-full rounded-card" />
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCardImovel key={i} />
        ))}
      </div>
    </div>
  );
}
