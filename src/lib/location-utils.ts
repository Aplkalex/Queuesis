import { BUILDINGS } from './constants';

const BUILDING_ENTRIES = Object.entries(BUILDINGS).map(([code, name]) => ({ code, name }));

const normalizeLocationText = (value: string): string => {
  return value
    .toUpperCase()
    .replace(/[＿_]+/g, ' ')
    .replace(/[.,;:()\[\]{}]+/g, ' ')
    .replace(/\bBLDG\b/g, 'BUILDING')
    .replace(/\bINT'L\b/g, 'INTERNATIONAL')
    .replace(/\bINTL\b/g, 'INTERNATIONAL')
    .replace(/\s+/g, ' ')
    .trim();
};

const splitPrefix = (source: string, prefix: string): string => {
  if (!source.startsWith(prefix)) return source;
  return source.slice(prefix.length).trim();
};

const findByCodePrefix = (normalized: string) => {
  const codeCandidates = BUILDING_ENTRIES
    .map(({ code, name }) => ({ code, name, normalizedCode: normalizeLocationText(code) }))
    .filter(({ normalizedCode }) => normalized === normalizedCode || normalized.startsWith(`${normalizedCode} `))
    .sort((left, right) => right.normalizedCode.length - left.normalizedCode.length);

  return codeCandidates[0] ?? null;
};

const findByNamePrefix = (normalized: string) => {
  const nameCandidates = BUILDING_ENTRIES
    .map(({ code, name }) => ({ code, name, normalizedName: normalizeLocationText(name) }))
    .filter(({ normalizedName }) => normalized === normalizedName || normalized.startsWith(`${normalizedName} `))
    .sort((left, right) => right.normalizedName.length - left.normalizedName.length);

  return nameCandidates[0] ?? null;
};

/**
 * Get the full building name from a building code
 * @param code - Building code (e.g., "LSB", "ERB")
 * @returns Full building name or the original code if not found
 */
export function getBuildingName(code: string): string {
  return BUILDINGS[code as keyof typeof BUILDINGS] || code;
}

/**
 * Parse a location string to extract building code and room number
 * Examples: "LSB LT1" -> { building: "LSB", room: "LT1", fullName: "Lady Shaw Building LT1" }
 */
export function parseLocation(location: string): {
  building: string;
  room: string;
  buildingName: string;
  fullName: string;
} {
  const normalized = normalizeLocationText(location);

  const codeMatch = findByCodePrefix(normalized);
  if (codeMatch) {
    const room = splitPrefix(normalized, codeMatch.normalizedCode);
    const building = codeMatch.code;
    const buildingName = codeMatch.name;

    return {
      building,
      room,
      buildingName,
      fullName: room ? `${buildingName} ${room}` : buildingName,
    };
  }

  const nameMatch = findByNamePrefix(normalized);
  if (nameMatch) {
    const room = splitPrefix(normalized, nameMatch.normalizedName);
    const building = nameMatch.code;
    const buildingName = nameMatch.name;

    return {
      building,
      room,
      buildingName,
      fullName: room ? `${buildingName} ${room}` : buildingName,
    };
  }

  const parts = normalized.split(' ');
  const building = parts[0] ?? location;
  const room = parts.slice(1).join(' ');
  const buildingName = getBuildingName(building);
  
  return {
    building,
    room,
    buildingName,
    fullName: room ? `${buildingName} ${room}` : buildingName,
  };
}

/**
 * Format location string with full building name
 * @param location - Location string (e.g., "LSB LT1")
 * @returns Formatted location with full building name
 */
export function formatLocation(location: string): string {
  const { fullName } = parseLocation(location);
  return fullName;
}

/**
 * Get building abbreviation from location
 * @param location - Location string (e.g., "LSB LT1")
 * @returns Building code (e.g., "LSB")
 */
export function getBuildingCode(location: string): string {
  return parseLocation(location).building;
}

/**
 * Check if a building code exists in the BUILDINGS list
 */
export function isValidBuilding(code: string): boolean {
  return code in BUILDINGS;
}

/**
 * Get all building codes
 */
export function getAllBuildingCodes(): string[] {
  return Object.keys(BUILDINGS);
}

/**
 * Search buildings by name or code
 */
export function searchBuildings(query: string): Array<{ code: string; name: string }> {
  const lowerQuery = query.toLowerCase();
  return Object.entries(BUILDINGS)
    .filter(([code, name]) => 
      code.toLowerCase().includes(lowerQuery) || 
      name.toLowerCase().includes(lowerQuery)
    )
    .map(([code, name]) => ({ code, name }));
}
