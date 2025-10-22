'use client';

import { useState, useEffect, useCallback } from 'react';
import { QueueData } from '@/types/queue';

interface UseQueueDataOptions {
  initialData?: QueueData;
  filters?: {
    status?: string;
    payer?: string;
    page?: number;
    limit?: number;
  };
  autoRefresh?: boolean;
  refreshInterval?: number; // ms
}

interface UseQueueDataReturn {
  data: QueueData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateFilters: (newFilters: UseQueueDataOptions['filters']) => void;
}

export function useQueueData(options: UseQueueDataOptions = {}): UseQueueDataReturn {
  const {
    initialData,
    filters = {},
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
  } = options;

  const [data, setData] = useState<QueueData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState(filters);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (currentFilters.status) params.append('status', currentFilters.status);
      if (currentFilters.payer) params.append('payer', currentFilters.payer);
      if (currentFilters.page) params.append('page', currentFilters.page.toString());
      if (currentFilters.limit) params.append('limit', currentFilters.limit.toString());

      const url = `/api/queue${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const queueData: QueueData = await response.json();
      setData(queueData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching queue data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentFilters]);

  const updateFilters = useCallback((newFilters: UseQueueDataOptions['filters']) => {
    setCurrentFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (!initialData) {
      fetchData();
    }
  }, [fetchData, initialData]);

  // Refetch when filters change
  useEffect(() => {
    if (initialData) {
      // If we have initial data, only fetch when filters actually change
      if (JSON.stringify(currentFilters) !== JSON.stringify(filters)) {
        fetchData();
      }
    }
  }, [currentFilters, fetchData, initialData, filters]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    updateFilters,
  };
}