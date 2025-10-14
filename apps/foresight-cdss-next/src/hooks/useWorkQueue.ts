import {
  useMutation,
  UseMutationResult,
  useQuery,
  UseQueryResult,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { queryClient } from "@/lib/query/queryClient";
import { useUser } from "@clerk/nextjs";

// Define AWS schema-based work queue item type
type WorkQueueItem = {
  id: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  taskType: string;
  priority: number;
  status: string;
  assignedTo?: string;
  slaDeadline?: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
};

export function useWorkQueue(): {
  assignedWork: UseQueryResult<WorkQueueItem[] | null, Error>;
  getNextItem: UseMutationResult<unknown, Error, void, unknown>;
} {
  const { user } = useUser();

  const assignedWork = useQuery({
    queryKey: queryKeys.workQueue.assigned(user?.id ?? ""),
    queryFn: async () => {
      if (!user?.id) return null;
      
      const response = await fetch(`/api/work-queue/assigned?userId=${user.id}&status=in_progress`);
      if (!response.ok) {
        throw new Error('Failed to fetch assigned work');
      }
      
      const data = await response.json();
      return data as WorkQueueItem[];
    },
    enabled: !!user?.id,
    refetchInterval: 1000 * 60 * 2, // Poll every 2 min
  });

  const getNextItem = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const response = await fetch('/api/work-queue/next', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get next work item');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workQueue.assigned(user?.id ?? ""),
      });
    },
  });

  return { assignedWork, getNextItem };
}
