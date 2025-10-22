import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Database } from 'lucide-react';

export default function AuditTrailSkeleton() {
  return (
    <div className="space-y-6 p-8">
      {/* Header Skeleton */}
      <header className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-96" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
      </header>

      {/* Search and Filters Skeleton */}
      <Card className="border shadow-xs">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Skeleton */}
              <div className="flex-1">
                <Skeleton className="h-10 w-full" />
              </div>
              {/* Filter Buttons Skeleton */}
              <div className="flex gap-2">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log Skeleton */}
      <Card className="border shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-muted-foreground" />
            <Skeleton className="h-6 w-32" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {/* Entry Skeletons */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-4 h-4 mt-1 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Skeleton className="h-4 w-full mb-2" />
                        <div className="flex flex-wrap items-center gap-2">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Skeleton className="h-5 w-12 rounded-full" />
                        <Skeleton className="h-5 w-14 rounded-full" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}