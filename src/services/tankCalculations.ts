import { PropertyValue, Tank, Movement, getEffectiveVolume } from '@/types';

/**
 * Calculate volume-weighted average properties when blending oils
 */
export function calculateBlendedProperties(
  tankVolume: number,
  tankProperties: PropertyValue[],
  addedVolume: number,
  addedProperties: PropertyValue[]
): PropertyValue[] {
  const totalVolume = tankVolume + addedVolume;

  if (totalVolume === 0) {
    return addedProperties.length > 0 ? addedProperties : tankProperties;
  }

  // Create a map of all property IDs from both sources
  const allPropertyIds = new Set([
    ...tankProperties.map((p) => p.propertyId),
    ...addedProperties.map((p) => p.propertyId),
  ]);

  const blendedProperties: PropertyValue[] = [];

  for (const propertyId of allPropertyIds) {
    const tankProp = tankProperties.find((p) => p.propertyId === propertyId);
    const addedProp = addedProperties.find((p) => p.propertyId === propertyId);

    const tankValue = tankProp?.value ?? null;
    const addedValue = addedProp?.value ?? null;

    let blendedValue: number | null;

    if (tankValue !== null && addedValue !== null) {
      // Both have values - calculate weighted average
      blendedValue =
        (tankVolume * tankValue + addedVolume * addedValue) / totalVolume;
    } else if (tankValue !== null && tankVolume > 0) {
      // Only tank has value - adjust proportion
      blendedValue = (tankVolume * tankValue) / totalVolume;
    } else if (addedValue !== null && addedVolume > 0) {
      // Only added has value - adjust proportion
      blendedValue = (addedVolume * addedValue) / totalVolume;
    } else {
      blendedValue = null;
    }

    blendedProperties.push({
      propertyId,
      value: blendedValue !== null ? Math.round(blendedValue * 1000) / 1000 : null,
    });
  }

  return blendedProperties;
}

/**
 * Calculate projected tank state based on scheduled movements
 */
export function calculateProjectedState(
  tank: Tank,
  scheduledMovements: Movement[]
): { volume: number; properties: PropertyValue[] } {
  let projectedVolume = tank.currentVolume;
  let projectedProperties = [...tank.properties];

  // Sort movements by scheduled date
  const sortedMovements = [...scheduledMovements].sort(
    (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
  );

  for (const movement of sortedMovements) {
    const volume = getEffectiveVolume(movement);

    switch (movement.type) {
      case 'receive':
        if (movement.destinationTankId === tank.id) {
          // Add volume and blend properties
          projectedProperties = calculateBlendedProperties(
            projectedVolume,
            projectedProperties,
            volume,
            movement.properties
          );
          projectedVolume += volume;
        }
        break;

      case 'ship':
        if (movement.sourceTankId === tank.id) {
          // Remove volume (properties stay same)
          projectedVolume = Math.max(0, projectedVolume - volume);
        }
        break;

      case 'transfer':
        if (movement.sourceTankId === tank.id) {
          // Remove volume from this tank
          projectedVolume = Math.max(0, projectedVolume - volume);
        } else if (movement.destinationTankId === tank.id) {
          // Add volume to this tank with blended properties
          projectedProperties = calculateBlendedProperties(
            projectedVolume,
            projectedProperties,
            volume,
            movement.properties
          );
          projectedVolume += volume;
        }
        break;
    }
  }

  return {
    volume: Math.round(projectedVolume * 1000) / 1000,
    properties: projectedProperties,
  };
}

/**
 * Get volume change from a movement for a specific tank
 */
export function getVolumeChange(movement: Movement, tankId: string): number {
  const volume = getEffectiveVolume(movement);

  switch (movement.type) {
    case 'receive':
      return movement.destinationTankId === tankId ? volume : 0;
    case 'ship':
      return movement.sourceTankId === tankId ? -volume : 0;
    case 'transfer':
      if (movement.sourceTankId === tankId) return -volume;
      if (movement.destinationTankId === tankId) return volume;
      return 0;
    default:
      return 0;
  }
}
