import { Skeleton, SkeletonIndicadores, SkeletonTabela } from "@/presentation/components/ui";

export default function CarregandoAdmin() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-36" />
      </div>
      <SkeletonIndicadores />
      <div className="rounded-card border border-line bg-surface shadow-soft">
        <div className="border-b border-line p-4">
          <Skeleton className="h-5 w-48" />
        </div>
        <SkeletonTabela linhas={6} colunas={5} />
      </div>
    </div>
  );
}
