import { applyFilter, isPortInRange, parsePortList, parsePortRange } from './filter';

describe('isPortInRange', () => {
  it('returns true when port is within range', () => {
    expect(isPortInRange(80, [70, 90])).toBe(true);
  });

  it('returns true at boundaries', () => {
    expect(isPortInRange(70, [70, 90])).toBe(true);
    expect(isPortInRange(90, [70, 90])).toBe(true);
  });

  it('returns false outside range', () => {
    expect(isPortInRange(100, [70, 90])).toBe(false);
  });
});

describe('applyFilter', () => {
  const ports = [22, 80, 443, 3000, 8080, 9000];

  it('returns all ports when config is empty', () => {
    expect(applyFilter(ports, {})).toEqual(ports);
  });

  it('excludes specific ports', () => {
    const result = applyFilter(ports, { exclude: [22, 9000] });
    expect(result).toEqual([80, 443, 3000, 8080]);
  });

  it('includes only specified ports', () => {
    const result = applyFilter(ports, { include: [80, 443] });
    expect(result).toEqual([80, 443]);
  });

  it('filters by includeRange', () => {
    const result = applyFilter(ports, { includeRange: [80, 500] });
    expect(result).toEqual([80, 443]);
  });

  it('excludeRange takes precedence', () => {
    const result = applyFilter(ports, { excludeRange: [3000, 9000] });
    expect(result).toEqual([22, 80, 443]);
  });

  it('exclude list takes precedence over include', () => {
    const result = applyFilter(ports, { include: [80, 443], exclude: [80] });
    expect(result).toEqual([443]);
  });
});

describe('parsePortList', () => {
  it('parses comma-separated ports', () => {
    expect(parsePortList('80, 443, 3000')).toEqual([80, 443, 3000]);
  });

  it('filters out invalid entries', () => {
    expect(parsePortList('80, abc, -1, 99999')).toEqual([80]);
  });

  it('returns empty array for empty string', () => {
    expect(parsePortList('')).toEqual([]);
  });
});

describe('parsePortRange', () => {
  it('parses valid range', () => {
    expect(parsePortRange('1000-2000')).toEqual([1000, 2000]);
  });

  it('returns null for inverted range', () => {
    expect(parsePortRange('2000-1000')).toBeNull();
  });

  it('returns null for invalid input', () => {
    expect(parsePortRange('abc-def')).toBeNull();
    expect(parsePortRange('80')).toBeNull();
  });
});
