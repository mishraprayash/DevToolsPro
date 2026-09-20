import { describe, it, expect, vi } from 'vitest';
import { convertToNepali } from '../utils';

describe('Nepali Romanized Utilities', () => {
  it('should handle empty string input', async () => {
    const res = await convertToNepali('');
    expect(res.success).toBe(true);
    if (res.success) expect(res.data).toBe('');
  });

  it('should handle API response conversion', async () => {
    // Mock global fetch for API response
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ['SUCCESS', [['namaste', ['नमस्ते']]]]
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await convertToNepali('namaste');
    expect(res.success).toBe(true);
    if (res.success) expect(res.data).toBe('नमस्ते');

    vi.unstubAllGlobals();
  });
});
