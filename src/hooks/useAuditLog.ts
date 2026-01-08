'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuditLogEntry } from '@/types';
import { dataService } from '@/services/dataService';

export const auditLogKeys = {
  all: ['auditLog'] as const,
  byEntity: (entityType: string, entityId: string) =>
    ['auditLog', { entityType, entityId }] as const,
};

export function useAuditLog(entityType?: string, entityId?: string) {
  const queryClient = useQueryClient();

  const hasFilters = entityType && entityId;
  const queryKey = hasFilters
    ? auditLogKeys.byEntity(entityType, entityId)
    : auditLogKeys.all;

  const {
    data: entries = [],
    isPending,
    error,
  } = useQuery<AuditLogEntry[]>({
    queryKey,
    queryFn: () =>
      hasFilters
        ? dataService.auditLog.getByEntity(entityType, entityId)
        : dataService.auditLog.getAll(),
  });

  return {
    entries,
    loading: isPending,
    error: error instanceof Error ? error.message : null,
    refresh: () => queryClient.invalidateQueries({ queryKey }),
  };
}
