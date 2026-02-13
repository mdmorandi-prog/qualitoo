/**
 * Cryptographic utilities for document signing.
 * Uses Web Crypto API (SubtleCrypto) for SHA-256 hashing.
 */

export const sha256 = async (text: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
};

export const generateSignaturePayload = (params: {
  documentId: string;
  documentHash: string;
  signerId: string;
  signerName: string;
  signerEmail: string;
  timestamp: string;
}) => {
  return JSON.stringify({
    doc: params.documentId,
    hash: params.documentHash,
    signer: params.signerId,
    name: params.signerName,
    email: params.signerEmail,
    ts: params.timestamp,
    nonce: crypto.randomUUID(),
  });
};

export const generateVerificationCode = (): string => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, "0");
};
