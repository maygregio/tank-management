'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tank, PropertyValue } from '@/types';
import { dataService } from '@/services/dataService';

export const tankKeys = {
  all: ['tanks'] as const,
  detail: (id: string) => ['tanks', id] as const,
};

export function useTanks() {
  const queryClient = useQueryClient();

  const {
    data: tanks = [],
    isPending,
    error,
  } = useQuery({
    queryKey: tankKeys.all,
    queryFn: () => dataService.tanks.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (tank: Omit<Tank, 'id' | 'createdAt' | 'updatedAt'>) =>
      dataService.tanks.create(tank),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tankKeys.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Tank> }) =>
      dataService.tanks.update(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: tankKeys.all });
      queryClient.invalidateQueries({ queryKey: tankKeys.detail(id) });
    },
  });

  const resetMutation = useMutation({
    mutationFn: ({
      id,
      volume,
      properties,
    }: {
      id: string;
      volume: number;
      properties: PropertyValue[];
    }) => dataService.tanks.reset(id, volume, properties),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: tankKeys.all });
      queryClient.invalidateQueries({ queryKey: tankKeys.detail(id) });
    },
  });

  return {
    tanks,
    loading: isPending,
    error: error instanceof Error ? error.message : null,
    refresh: () => queryClient.invalidateQueries({ queryKey: tankKeys.all }),
    createTank: createMutation.mutateAsync,
    updateTank: (id: string, updates: Partial<Tank>) =>
      updateMutation.mutateAsync({ id, updates }),
    resetTank: (id: string, volume: number, properties: PropertyValue[]) =>
      resetMutation.mutateAsync({ id, volume, properties }),
  };
}

export function useTank(id: string) {
  const queryClient = useQueryClient();

  const {
    data: tank = null,
    isPending,
    error,
  } = useQuery({
    queryKey: tankKeys.detail(id),
    queryFn: () => dataService.tanks.getById(id),
    enabled: !!id,
  });

  return {
    tank,
    loading: isPending,
    error: error instanceof Error ? error.message : null,
    refresh: () =>
      queryClient.invalidateQueries({ queryKey: tankKeys.detail(id) }),
  };
}
