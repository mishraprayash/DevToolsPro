import { generateRsaKeypair } from './utils';

self.onmessage = async (e: MessageEvent) => {
  const { keySize, hashAlgorithm } = e.data;
  try {
    const result = await generateRsaKeypair({ keySize, hashAlgorithm });
    self.postMessage({ success: true, result });
  } catch (error) {
    self.postMessage({ success: false, error: (error as Error).message });
  }
};
