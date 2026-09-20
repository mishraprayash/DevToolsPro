import { describe, it, expect } from 'vitest';
import { generateRsaKeypair, signPayloadRsa, verifySignatureRsa } from '../utils';

describe('RSA Sandbox Utilities', () => {
  it('should generate RSA keypair, sign payload and verify signature', async () => {
    const keypair = await generateRsaKeypair({ keySize: 1024, hashAlgorithm: 'SHA-256' });
    expect(keypair.publicKey).toContain('-----BEGIN PUBLIC KEY-----');
    expect(keypair.privateKey).toContain('-----BEGIN PRIVATE KEY-----');

    const payload = 'Data to be signed';
    const signature = await signPayloadRsa(keypair.privateKey, payload, 'SHA-256');
    expect(signature).toBeDefined();

    const isValid = await verifySignatureRsa(keypair.publicKey, payload, signature, 'SHA-256');
    expect(isValid).toBe(true);

    const isTamperedValid = await verifySignatureRsa(keypair.publicKey, 'Tampered Data', signature, 'SHA-256');
    expect(isTamperedValid).toBe(false);
  });
});
