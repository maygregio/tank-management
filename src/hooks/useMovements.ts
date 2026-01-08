'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Movement } from '@/types';
import { dataService } from '@/services/dataService';
import { tankKeys } from './useTanks';

export const movementKeys = {
  all: ['movements'] as const,
  byTank: (tankId: string) => ['movements', { tankId }] as const,
};

export function useMovements(tankId?: string) {
  const queryClient = useQueryClient();

  const queryKey = tankId ? movementKeys.byTank(tankId) : movementKeys.all;

  const {
    data: movements = [],
    isPending,
    error,
  } = useQuery({
    queryKey,
    queryFn: () =>
      tankId
        ? dataService.movements.getByTankId(tankId)
        : dataService.movements.getAll(),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: movementKeys.all });
    queryClient.invalidateQueries({ queryKey: tankKeys.all });
  };

  const createMutation = useMutation({
    mutationFn: (movement: Omit<Movement, 'id' | 'createdAt'>) =>
      dataService.movements.create(movement),
    onSuccess: invalidateAll,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Movement> }) =>
      dataService.movements.update(id, updates),
    onSuccess: invalidateAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dataService.movements.delete(id),
    onSuccess: invalidateAll,
  });

  return {
    movements,
    loading: isPending,
    error: error instanceof Error ? error.message : null,
    refresh: () => queryClient.invalidateQueries({ queryKey }),
    createMovement: createMutation.mutateAsync,
    updateMovement: (id: string, updates: Partial<Movement>) =>
      updateMutation.mutateAsync({ id, updates }),
    deleteMovement: deleteMutation.mutateAsync,
  };
}
