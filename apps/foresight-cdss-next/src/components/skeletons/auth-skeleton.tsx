import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function AuthSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gray-200 rounded-lg animate-pulse" />
          <div className="mt-6 h-8 bg-gray-200 rounded animate-pulse" />
          <div className="mt-2 h-4 bg-gray-200 rounded animate-pulse" />
        </div>

        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-20 bg-gray-200 rounded animate-pulse" />
            <div className="space-y-3">
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <div className="h-3 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
