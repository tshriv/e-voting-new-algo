// src/crypto/types.ts
import BN from 'bn.js';
import { ec } from 'elliptic';

export interface PublicKey {
  x: string;
  y: string;
  curve: string;
}

export interface PrivateKey {
  d: BN;
  publicKey: PublicKey;
}

export interface Signature {
  keyImage: { x: string; y: string };
  c: BN[];
  r: BN[];
}

// Add this type for elliptic curve points
export type ECPoint = ReturnType<ec['curve']['point']>;