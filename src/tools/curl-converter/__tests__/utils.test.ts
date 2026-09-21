import { describe, it, expect } from 'vitest';
import { convertCurl } from '../utils';

describe('cURL Converter Utilities', () => {
  const sampleCurl = `curl -X POST https://api.example.com/v1/users \\
  -H "Authorization: Bearer token123" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Alice"}'`;

  it('should reject invalid non-curl commands', async () => {
    const result = await convertCurl('wget https://example.com', 'python');
    expect(result.success).toBe(false);
    expect(result.error).toContain('starting with "curl"');
  });

  it('should convert curl to Python Requests', async () => {
    const result = await convertCurl(sampleCurl, 'python');
    expect(result.success).toBe(true);
    expect(result.code).toContain('requests.post');
    expect(result.code).toContain('token123');
    expect(result.code).toContain('Alice');
  });

  it('should convert curl to JavaScript Fetch', async () => {
    const result = await convertCurl(sampleCurl, 'javascript-fetch');
    expect(result.success).toBe(true);
    expect(result.code).toContain('fetch(');
    expect(result.code).toContain('Authorization');
  });

  it('should convert curl to all other target languages', async () => {
    const targets = [
      'javascript-axios',
      'javascript-xhr',
      'go',
      'rust',
      'php',
      'java',
      'csharp',
      'ruby'
    ] as const;

    for (const target of targets) {
      const res = await convertCurl(sampleCurl, target);
      expect(res.success).toBe(true);
      expect(res.code).toBeDefined();
      expect(res.code!.length).toBeGreaterThan(0);
    }
  });

  it('should fallback to default language if target is unknown', async () => {
    // @ts-expect-error - testing invalid target fallback
    const res = await convertCurl(sampleCurl, 'unknown-lang');
    expect(res.success).toBe(true);
    expect(res.code).toContain('fetch(');
  });

  it('should handle empty or null input gracefully', async () => {
    // @ts-expect-error - testing invalid input
    const res = await convertCurl(null, 'python');
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  describe('inspectCurl', () => {
    it('should inspect curl options and parse URL, method, headers, and body presence', async () => {
      const { inspectCurl } = await import('../utils');
      const getCurl = 'curl -H "Accept: application/json" https://api.example.com/items';
      const details = await inspectCurl(getCurl);
      expect(details.url).toBe('https://api.example.com/items');
      expect(details.method).toBe('GET');
      expect(details.headers['Accept']).toBe('application/json');
      expect(details.hasBody).toBe(false);
    });

    it('should detect various HTTP methods and bodies', async () => {
      const { inspectCurl } = await import('../utils');

      const putCurl = 'curl -X PUT https://api.example.com/items/1';
      const putDetails = await inspectCurl(putCurl);
      expect(putDetails.method).toBe('PUT');
      expect(putDetails.hasBody).toBe(false);

      const postCurl = 'curl https://api.example.com/items -d "data"';
      const postDetails = await inspectCurl(postCurl);
      expect(postDetails.method).toBe('POST');
      expect(postDetails.hasBody).toBe(true);

      const deleteCurl = 'curl -X DELETE https://api.example.com/items/1';
      const deleteDetails = await inspectCurl(deleteCurl);
      expect(deleteDetails.method).toBe('DELETE');

      const patchCurl = 'curl -X PATCH https://api.example.com/items/1';
      const patchDetails = await inspectCurl(patchCurl);
      expect(patchDetails.method).toBe('PATCH');

      const headCurl = 'curl -X HEAD https://api.example.com/items/1';
      const headDetails = await inspectCurl(headCurl);
      expect(headDetails.method).toBe('HEAD');
    });
  });
});
