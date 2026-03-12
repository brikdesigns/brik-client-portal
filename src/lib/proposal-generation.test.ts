import { describe, it, expect } from 'vitest';
import { validateScopeItems, extractAndParseJSON, type ServiceDetail } from './proposal-generation';

// Helper to create a minimal ServiceDetail for testing
function makeService(overrides: Partial<ServiceDetail> & { id: string; name: string }): Pick<ServiceDetail, 'id' | 'name' | 'category_slug' | 'included_scope' | 'not_included' | 'projected_timeline'> {
  return {
    id: overrides.id,
    name: overrides.name,
    category_slug: overrides.category_slug ?? 'brand',
    included_scope: overrides.included_scope ?? null,
    not_included: overrides.not_included ?? null,
    projected_timeline: overrides.projected_timeline ?? null,
  };
}

describe('validateScopeItems', () => {
  const svcA = makeService({ id: 'aaa-111', name: 'Brand Guidelines' });
  const svcB = makeService({ id: 'bbb-222', name: 'Website Maintenance', category_slug: 'product' });
  const svcC = makeService({ id: 'ccc-333', name: 'Marketing Support', included_scope: 'Monthly analytics', projected_timeline: '3 months' });

  // ── Happy path ──

  it('passes through items that match selected services by ID', () => {
    const rawItems = [
      { service_id: 'aaa-111', service_name: 'Brand Guidelines', category_slug: 'brand', included: ['Logo'], not_included: [], timeline: '2 weeks' },
      { service_id: 'bbb-222', service_name: 'Website Maintenance', category_slug: 'product', included: ['Updates'], not_included: [], timeline: '1 month' },
    ];

    const result = validateScopeItems(rawItems, [svcA, svcB]);

    expect(result.scopeItems).toHaveLength(2);
    expect(result.warnings).toHaveLength(0);
    expect(result.scopeItems[0].service_id).toBe('aaa-111');
    expect(result.scopeItems[1].service_id).toBe('bbb-222');
  });

  // ── Bug 1 reproduction: AI hallucinates extra services ──

  it('removes hallucinated services not in the selected set', () => {
    const rawItems = [
      { service_id: 'aaa-111', service_name: 'Brand Guidelines', category_slug: 'brand', included: ['Logo'], not_included: [], timeline: '2 weeks' },
      { service_id: 'zzz-999', service_name: 'Premium Logo Design', category_slug: 'brand', included: ['Logo v2'], not_included: [], timeline: '3 weeks' },
      { service_id: 'yyy-888', service_name: 'Online Business Listings', category_slug: 'marketing', included: ['Listings'], not_included: [], timeline: '1 week' },
    ];

    const result = validateScopeItems(rawItems, [svcA]);

    expect(result.scopeItems).toHaveLength(1);
    expect(result.scopeItems[0].service_name).toBe('Brand Guidelines');
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings[0]).toContain('Premium Logo Design');
    expect(result.warnings[1]).toContain('Online Business Listings');
  });

  // ── Bug 1 reproduction: AI returns wrong service_id but correct name ──

  it('corrects service_id when AI uses wrong UUID but matching name', () => {
    const rawItems = [
      { service_id: 'wrong-uuid', service_name: 'Brand Guidelines', category_slug: 'brand', included: ['Logo'], not_included: [], timeline: '2 weeks' },
    ];

    const result = validateScopeItems(rawItems, [svcA]);

    expect(result.scopeItems).toHaveLength(1);
    expect(result.scopeItems[0].service_id).toBe('aaa-111');
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('Corrected service_id');
  });

  // ── Bug 1 reproduction: AI omits a selected service entirely ──

  it('backfills missing services the AI omitted', () => {
    const rawItems = [
      { service_id: 'aaa-111', service_name: 'Brand Guidelines', category_slug: 'brand', included: ['Logo'], not_included: [], timeline: '2 weeks' },
    ];

    const result = validateScopeItems(rawItems, [svcA, svcB]);

    expect(result.scopeItems).toHaveLength(2);
    expect(result.scopeItems[1].service_id).toBe('bbb-222');
    expect(result.scopeItems[1].service_name).toBe('Website Maintenance');
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('Backfilled missing service');
  });

  // ── Edge case: AI returns nothing ──

  it('backfills all services when AI returns empty scope_items', () => {
    const result = validateScopeItems([], [svcA, svcB, svcC]);

    expect(result.scopeItems).toHaveLength(3);
    expect(result.warnings).toHaveLength(3);
    result.warnings.forEach(w => expect(w).toContain('Backfilled'));
  });

  // ── Edge case: backfilled service uses catalog data ──

  it('uses catalog included_scope and projected_timeline for backfilled stubs', () => {
    const result = validateScopeItems([], [svcC]);

    expect(result.scopeItems).toHaveLength(1);
    expect(result.scopeItems[0].included).toEqual(['Monthly analytics']);
    expect(result.scopeItems[0].timeline).toBe('3 months');
  });

  // ── Edge case: duplicate hallucinated names ──

  it('does not match the same selected service twice via name fallback', () => {
    const rawItems = [
      { service_id: 'wrong-1', service_name: 'Brand Guidelines', category_slug: 'brand', included: ['V1'], not_included: [], timeline: '1w' },
      { service_id: 'wrong-2', service_name: 'Brand Guidelines', category_slug: 'brand', included: ['V2'], not_included: [], timeline: '2w' },
    ];

    const result = validateScopeItems(rawItems, [svcA]);

    // First one matches by name, second is a duplicate and gets removed
    expect(result.scopeItems).toHaveLength(1);
    expect(result.scopeItems[0].included).toEqual(['V1']);
  });

  // ── Case-insensitive name matching ──

  it('matches service names case-insensitively', () => {
    const rawItems = [
      { service_id: 'bad-id', service_name: 'brand guidelines', category_slug: 'brand', included: ['Logo'], not_included: [], timeline: '2w' },
    ];

    const result = validateScopeItems(rawItems, [svcA]);

    expect(result.scopeItems).toHaveLength(1);
    expect(result.scopeItems[0].service_id).toBe('aaa-111');
  });

  // ── Normalizes malformed AI output ──

  it('normalizes missing fields to safe defaults', () => {
    const rawItems = [
      { service_id: 'aaa-111', service_name: undefined, included: 'not-an-array' } as unknown as Record<string, unknown>,
    ];

    const result = validateScopeItems(rawItems as never, [svcA]);

    // service_name defaults to 'Unknown Service' which won't match by name
    // But it matches by ID
    expect(result.scopeItems).toHaveLength(1);
    expect(result.scopeItems[0].service_name).toBe('Unknown Service');
    expect(result.scopeItems[0].included).toEqual([]);
  });
});

describe('extractAndParseJSON', () => {
  it('parses raw JSON', () => {
    const result = extractAndParseJSON<{ a: number }>('{"a": 1}', 'test');
    expect(result).toEqual({ a: 1 });
  });

  it('parses JSON wrapped in ```json fences', () => {
    const input = '```json\n{"title": "hello"}\n```';
    const result = extractAndParseJSON<{ title: string }>(input, 'test');
    expect(result.title).toBe('hello');
  });

  it('parses JSON wrapped in ``` fences (no language tag)', () => {
    const input = '```\n{"title": "hello"}\n```';
    const result = extractAndParseJSON<{ title: string }>(input, 'test');
    expect(result.title).toBe('hello');
  });

  it('extracts JSON when there is preamble text before a code fence', () => {
    const input = 'Here is the proposal:\n\n```json\n{"title": "hello"}\n```\n\nLet me know if you need changes.';
    const result = extractAndParseJSON<{ title: string }>(input, 'test');
    expect(result.title).toBe('hello');
  });

  it('extracts JSON by finding first { } block as last resort', () => {
    const input = 'Sure, here you go: {"data": true} - hope that helps!';
    const result = extractAndParseJSON<{ data: boolean }>(input, 'test');
    expect(result.data).toBe(true);
  });

  it('throws on completely non-JSON input', () => {
    expect(() => extractAndParseJSON('<html>502 Bad Gateway</html>', 'test')).toThrow(
      /Failed to extract JSON/
    );
  });

  it('throws on empty string', () => {
    expect(() => extractAndParseJSON('', 'test')).toThrow();
  });

  it('handles multiline JSON in code fences', () => {
    const input = '```json\n{\n  "overview": {\n    "title": "Overview",\n    "content": "Hello world"\n  }\n}\n```';
    const result = extractAndParseJSON<{ overview: { title: string } }>(input, 'test');
    expect(result.overview.title).toBe('Overview');
  });
});
