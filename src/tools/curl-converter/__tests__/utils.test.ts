import { describe, it, expect } from 'vitest';
import { convertCurl, inspectCurl, TargetLanguage } from '../utils';

describe('cURL Converter Utilities', () => {
  const sampleCurl = `curl -X POST https://api.example.com/v1/users -H "Authorization: Bearer token123" -H "Content-Type: application/json" -d '{"name": "Alice"}'`;

  describe('convertCurl', () => {
    it('should reject empty or non-curl input', async () => {
      const emptyResult = await convertCurl('', 'python');
      expect(emptyResult.success).toBe(false);
      expect(emptyResult.error).toContain('starting with "curl"');

      const nonCurlResult = await convertCurl('wget https://example.com', 'python');
      expect(nonCurlResult.success).toBe(false);
      expect(nonCurlResult.error).toContain('starting with "curl"');

      const whitespaceResult = await convertCurl('   ', 'python');
      expect(whitespaceResult.success).toBe(false);
      expect(whitespaceResult.error).toContain('starting with "curl"');
    });

    const targets: TargetLanguage[] = [
      'javascript-fetch',
      'javascript-axios',
      'javascript-xhr',
      'python',
      'go',
      'rust',
      'php',
      'java',
      'csharp',
      'ruby',
    ];

    targets.forEach((target) => {
      it(`should convert curl to ${target}`, async () => {
        const result = await convertCurl(sampleCurl, target);
        expect(result.success).toBe(true);
        expect(result.code).toBeDefined();
        expect(typeof result.code).toBe('string');
        expect(result.code?.length).toBeGreaterThan(0);
      });
    });

    it('should fallback to default target for unknown target type', async () => {
      const result = await convertCurl(sampleCurl, 'unknown-lang' as TargetLanguage);
      expect(result.success).toBe(true);
      expect(result.code).toContain('fetch(');
    });

    it('should handle malformed cURL parsing errors gracefully', async () => {
      // Malformed curl command options that trigger parser errors in curlconverter
      const badCurl = 'curl --invalid-flag-that-does-not-exist-xyz https://example.com';
      const result = await convertCurl(badCurl, 'python');
      // Either fails gracefully or returns error message in result
      if (!result.success) {
        expect(result.error).toBeDefined();
      } else {
        expect(result.code).toBeDefined();
      }
    });
  });

  describe('inspectCurl', () => {
    it('should inspect GET request without body or headers', async () => {
      const details = await inspectCurl('curl https://example.com/api/data');
      expect(details.url).toBe('https://example.com/api/data');
      expect(details.method).toBe('GET');
      expect(details.hasBody).toBe(false);
      expect(details.headers).toEqual({});
    });

    it('should inspect POST request with headers and body', async () => {
      const details = await inspectCurl(sampleCurl);
      expect(details.url).toBe('https://api.example.com/v1/users');
      expect(details.method).toBe('POST');
      expect(details.hasBody).toBe(true);
      expect(details.headers).toEqual({
        'Authorization': 'Bearer token123',
        'Content-Type': 'application/json',
      });
    });

    it('should identify PUT, DELETE, PATCH, and HEAD HTTP methods', async () => {
      const putDetails = await inspectCurl('curl -X PUT https://example.com/items/1');
      expect(putDetails.method).toBe('PUT');

      const deleteDetails = await inspectCurl('curl -X DELETE https://example.com/items/1');
      expect(deleteDetails.method).toBe('DELETE');

      const patchDetails = await inspectCurl('curl --request PATCH https://example.com/items/1');
      expect(patchDetails.method).toBe('PATCH');

      const headDetails = await inspectCurl('curl -X HEAD https://example.com');
      expect(headDetails.method).toBe('HEAD');
    });

    it('should detect body from --data, --data-raw, and --data-binary options', async () => {
      const d1 = await inspectCurl('curl --data "foo=bar" https://example.com');
      expect(d1.method).toBe('POST');
      expect(d1.hasBody).toBe(true);

      const d2 = await inspectCurl('curl --data-raw "foo=bar" https://example.com');
      expect(d2.method).toBe('POST');
      expect(d2.hasBody).toBe(true);

      const d3 = await inspectCurl('curl --data-binary "@file.bin" https://example.com');
      expect(d3.method).toBe('POST');
      expect(d3.hasBody).toBe(true);
    });

    it('should handle missing URL or empty string input in inspectCurl', async () => {
      const empty = await inspectCurl('');
      expect(empty.url).toBe('');
      expect(empty.method).toBe('GET');
      expect(empty.hasBody).toBe(false);
      expect(empty.headers).toEqual({});
    });
  });
});
