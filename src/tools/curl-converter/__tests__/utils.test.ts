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
    if (!result.success) console.error(result.error);
    expect(result.success).toBe(true);
    expect(result.code).toContain('fetch(');
    expect(result.code).toContain('Authorization');
  });
});
