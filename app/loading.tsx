import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-reading flex-col gap-6 px-4 py-10 lg:max-w-5xl">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-full sm:w-80" />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
