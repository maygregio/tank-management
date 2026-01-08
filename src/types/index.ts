// Property definition (user can add custom properties)
export interface PropertyDefinition {
  id: string;
  name: string;           // e.g., "API", "Sulfur"
  unit: string;           // e.g., "degrees", "%", "ppm"
  createdAt: string;
}

// Property value on a tank or movement
export interface PropertyValue {
  propertyId: string;
  value: number | null;   // null if not measured
}

// Tank
export interface Tank {
  id: string;
  name: string;
  product: string;        // e.g., "Carbon Black Oil"
  location: string;       // user-defined location
  currentVolume: number;  // in kilo barrels
  properties: PropertyValue[];
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_PRODUCT = 'Carbon Black Oil';

// Movement types
export type MovementType = 'receive' | 'transfer' | 'ship';

// Movement
export interface Movement {
  id: string;
  type: MovementType;
  date: string | null;            // If set, movement is completed; if null, it's scheduled
  scheduledDate: string;           // Scheduled date
  expectedVolume: number;          // kilo barrels (user entered)
  actualVolume?: number;           // kilo barrels (extracted via background job)
  sourceTankId: string | null;     // null for 'receive'
  destinationTankId: string | null;// null for 'ship'
  properties: PropertyValue[];     // Analysis results
  carrier?: string;
  ticketNumber?: string;
  notes?: string;
  pdfPath?: string;                // Path to uploaded PDF
  createdAt: string;
  createdBy: string;               // User ID
}

// Get effective volume: actualVolume if available, otherwise expectedVolume
export function getEffectiveVolume(movement: Movement): number {
  return movement.actualVolume ?? movement.expectedVolume;
}

// Check if movement is completed (has a date set)
export function isMovementCompleted(movement: Movement): boolean {
  return movement.date !== null;
}

// Audit log action types
export type AuditAction = 'create' | 'update' | 'delete' | 'reset';
export type AuditEntityType = 'tank' | 'movement' | 'property';

// Audit log entry
export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  userId: string;
  timestamp: string;
  changes: Record<string, { old: unknown; new: unknown }>;
  description?: string;
}

// User (simple for now, auth later)
export interface User {
  id: string;
  name: string;
}

// Extracted PDF data
export interface ExtractedPdfData {
  volume?: number;
  properties: Array<{
    name: string;
    value: number;
    unit?: string;
  }>;
  rawText?: string;
}

// Tank with projected values
export interface TankProjection {
  tank: Tank;
  projectedVolume: number;
  projectedProperties: PropertyValue[];
  scheduledMovements: Movement[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
