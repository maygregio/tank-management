'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PropertyDefinition } from '@/types';
import { dataService } from '@/services/dataService';

export const propertyKeys = {
  all: ['properties'] as const,
};

export function useProperties() {
  const queryClient = useQueryClient();

  const {
    data: properties = [],
    isPending,
    error,
  } = useQuery({
    queryKey: propertyKeys.all,
    queryFn: () => dataService.properties.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (property: Omit<PropertyDefinition, 'id' | 'createdAt'>) =>
      dataService.properties.create(property),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<PropertyDefinition>;
    }) => dataService.properties.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dataService.properties.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
    },
  });

  return {
    properties,
    loading: isPending,
    error: error instanceof Error ? error.message : null,
    refresh: () =>
      queryClient.invalidateQueries({ queryKey: propertyKeys.all }),
    createProperty: createMutation.mutateAsync,
    updateProperty: (id: string, updates: Partial<PropertyDefinition>) =>
      updateMutation.mutateAsync({ id, updates }),
    deleteProperty: deleteMutation.mutateAsync,
  };
}
