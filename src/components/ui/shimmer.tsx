import { cn } from '@/lib/utils';

interface ShimmerProps {
  className?: string;
}

export function Shimmer({ className }: ShimmerProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded",
        className
      )}
      style={{
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    />
  );
}

// Table shimmer for data tables
export function TableShimmer({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Table header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Shimmer key={i} className="h-4 w-full" />
        ))}
      </div>
      
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Shimmer key={colIndex} className="h-8 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Card shimmer for dashboard cards
export function CardShimmer() {
  return (
    <div className="p-6 border rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <Shimmer className="h-4 w-24" />
        <Shimmer className="h-8 w-8 rounded-full" />
      </div>
      <Shimmer className="h-8 w-16" />
      <Shimmer className="h-3 w-32" />
    </div>
  );
}

// Stats card shimmer
export function StatsCardShimmer() {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <Shimmer className="h-4 w-20" />
        <Shimmer className="h-6 w-6 rounded" />
      </div>
      <Shimmer className="h-6 w-12" />
      <div className="flex items-center gap-2">
        <Shimmer className="h-3 w-3 rounded-full" />
        <Shimmer className="h-3 w-16" />
      </div>
    </div>
  );
}

// Form shimmer
export function FormShimmer() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Shimmer className="h-4 w-20" />
          <Shimmer className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Shimmer className="h-4 w-16" />
          <Shimmer className="h-10 w-full" />
        </div>
      </div>
      
      <div className="space-y-2">
        <Shimmer className="h-4 w-24" />
        <Shimmer className="h-20 w-full" />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Shimmer className="h-4 w-16" />
            <Shimmer className="h-10 w-full" />
          </div>
        ))}
      </div>
      
      <div className="flex justify-end gap-2">
        <Shimmer className="h-10 w-20" />
        <Shimmer className="h-10 w-24" />
      </div>
    </div>
  );
}

// Chart shimmer
export function ChartShimmer() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Shimmer className="h-6 w-32" />
        <Shimmer className="h-8 w-24" />
      </div>
      <div className="h-64 flex items-end justify-between gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Shimmer 
            key={i} 
            className="w-full" 
            style={{ height: `${Math.random() * 80 + 20}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// Product grid shimmer
export function ProductGridShimmer({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <Shimmer className="h-32 w-full rounded" />
          <Shimmer className="h-4 w-3/4" />
          <Shimmer className="h-3 w-1/2" />
          <div className="flex justify-between items-center">
            <Shimmer className="h-5 w-16" />
            <Shimmer className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

// List shimmer for simple lists
export function ListShimmer({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 border rounded">
          <div className="flex items-center gap-3">
            <Shimmer className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <Shimmer className="h-4 w-32" />
              <Shimmer className="h-3 w-24" />
            </div>
          </div>
          <div className="flex gap-2">
            <Shimmer className="h-8 w-8 rounded" />
            <Shimmer className="h-8 w-8 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}