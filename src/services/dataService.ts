import {
  Tank,
  Movement,
  PropertyDefinition,
  User,
  AuditLogEntry,
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

// Generic fetch wrapper
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

// Data service with abstracted CRUD operations
export const dataService = {
  // Tanks
  tanks: {
    getAll: (): Promise<Tank[]> => fetchApi('/tanks'),

    getById: (id: string): Promise<Tank> => fetchApi(`/tanks/${id}`),

    create: (tank: Omit<Tank, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tank> =>
      fetchApi('/tanks', {
        method: 'POST',
        body: JSON.stringify(tank),
      }),

    update: (id: string, updates: Partial<Tank>): Promise<Tank> =>
      fetchApi(`/tanks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),

    reset: (id: string, volume: number, properties: Tank['properties']): Promise<Tank> =>
      fetchApi(`/tanks/${id}/reset`, {
        method: 'POST',
        body: JSON.stringify({ volume, properties }),
      }),
  },

  // Movements
  movements: {
    getAll: (): Promise<Movement[]> => fetchApi('/movements'),

    getByTankId: (tankId: string): Promise<Movement[]> =>
      fetchApi(`/movements?tankId=${tankId}`),

    getById: (id: string): Promise<Movement> => fetchApi(`/movements/${id}`),

    create: (movement: Omit<Movement, 'id' | 'createdAt'>): Promise<Movement> =>
      fetchApi('/movements', {
        method: 'POST',
        body: JSON.stringify(movement),
      }),

    update: (id: string, updates: Partial<Movement>): Promise<Movement> =>
      fetchApi(`/movements/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),

    complete: (id: string, date: string): Promise<Movement> =>
      fetchApi(`/movements/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify({ date }),
      }),

    delete: (id: string): Promise<void> =>
      fetchApi(`/movements/${id}`, {
        method: 'DELETE',
      }),
  },

  // Property Definitions
  properties: {
    getAll: (): Promise<PropertyDefinition[]> => fetchApi('/properties'),

    create: (property: Omit<PropertyDefinition, 'id' | 'createdAt'>): Promise<PropertyDefinition> =>
      fetchApi('/properties', {
        method: 'POST',
        body: JSON.stringify(property),
      }),

    update: (id: string, updates: Partial<PropertyDefinition>): Promise<PropertyDefinition> =>
      fetchApi(`/properties/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),

    delete: (id: string): Promise<void> =>
      fetchApi(`/properties/${id}`, {
        method: 'DELETE',
      }),
  },

  // Users
  users: {
    getAll: (): Promise<User[]> => fetchApi('/users'),

    getById: (id: string): Promise<User> => fetchApi(`/users/${id}`),
  },

  // Audit Log
  auditLog: {
    getAll: async (page = 1, limit = 50): Promise<AuditLogEntry[]> => {
      const response = await fetchApi<{
        data: AuditLogEntry[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`/audit-log?page=${page}&limit=${limit}`);
      return response.data;
    },

    getPaginated: (page = 1, limit = 50): Promise<{
      data: AuditLogEntry[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
      };
    }> => fetchApi(`/audit-log?page=${page}&limit=${limit}`),

    getByEntity: async (entityType: string, entityId: string): Promise<AuditLogEntry[]> => {
      const response = await fetchApi<{
        data: AuditLogEntry[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`/audit-log?entityType=${entityType}&entityId=${entityId}`);
      return response.data;
    },
  },

  // PDF Extraction
  pdf: {
    extract: async (file: File): Promise<{
      volume?: number;
      properties: Array<{ name: string; value: number; unit?: string }>;
    }> => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/extract-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'PDF extraction failed');
      }

      return response.json();
    },

    upload: async (file: File): Promise<{ path: string }> => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/upload-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'PDF upload failed');
      }

      return response.json();
    },
  },
};
