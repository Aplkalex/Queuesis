import { describe, it, expect } from '@jest/globals';
import { parseLocation, getBuildingCode } from '../location-utils';

describe('location utils', () => {
  it('parses code_room format correctly', () => {
    const parsed = parseLocation('FYB_405');

    expect(parsed.building).toBe('FYB');
    expect(parsed.buildingName).toBe('Wong Foo Yuan Building');
    expect(parsed.room).toBe('405');
  });

  it('parses full building name format with Bldg alias', () => {
    const parsed = parseLocation('Wu Ho Man Yuen Bldg 306');

    expect(parsed.building).toBe('WMY');
    expect(parsed.buildingName).toBe('Wu Ho Man Yuen Building');
    expect(parsed.room).toBe('306');
  });

  it('returns normalized code from getBuildingCode', () => {
    expect(getBuildingCode('Wu Ho Man Yuen Bldg 306')).toBe('WMY');
    expect(getBuildingCode('YIA_LT4')).toBe('YIA');
  });
});
