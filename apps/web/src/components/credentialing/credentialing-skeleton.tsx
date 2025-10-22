import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function CredentialingSkeleton() {
  return (
    <div className="p-8 bg-background min-h-screen">
      {/* Header */}
      <header className="mb-6">
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </header>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-card border shadow-xs">
            <div className="p-4 text-center">
              <Skeleton className="h-4 w-20 mb-2 mx-auto" />
              <Skeleton className="h-8 w-12 mb-1 mx-auto" />
              <Skeleton className="h-3 w-24 mx-auto" />
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
          </div>
        </Card>
        <div className="mt-4">
          <Skeleton className="h-3 w-48" />
        </div>
      </div>

      {/* Credentialing Table */}
      <Card className="bg-card border shadow-xs">
        <div className="p-4">
          <div className="space-y-2 mb-4">
            <Skeleton className="h-6 w-64" />
          </div>
          
          <div className="overflow-x-auto">
            <div className="space-y-4">
              {/* Table header */}
              <div className="flex gap-4 pb-2 border-b">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 flex-1" />
                ))}
              </div>
              
              {/* Table rows */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex gap-4 py-3">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Key Performance Indicators */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="bg-card border shadow-xs">
            <div className="p-6">
              <Skeleton className="h-5 w-32 mb-2" />
              <div className="flex items-center gap-2 mb-1">
                <Skeleton className="h-2 flex-1 rounded-full" />
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-3 w-24" />
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="bg-card border shadow-xs mt-6">
        <div className="p-4">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="flex flex-wrap gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-32" />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}