import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
      {/* Image skeleton */}
      <div className="relative mb-4">
        <Skeleton className="aspect-square w-full rounded-md" />
      </div>
      
      {/* Content skeleton */}
      <div className="space-y-3">
        {/* Title */}
        <Skeleton className="h-5 w-3/4" />
        
        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        
        {/* Price and button */}
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      </div>
    </div>
  );
}