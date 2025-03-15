// src/crypto/testUtils.ts
import { ec as EC } from 'elliptic';
import BN from 'bn.js';
import { PrivateKey, PublicKey } from './types';

export async function generateTestPrivateKey(): Promise<PrivateKey> {
  const curve = new EC('p256');
  const keyPair = curve.genKeyPair();
  
  return {
    d: new BN(keyPair.getPrivate().toArray()),
    publicKey: {
      x: keyPair.getPublic().getX().toString('hex'),
      y: keyPair.getPublic().getY().toString('hex'),
      curve: 'p256'
    }
  };
}

export async function generateTestPublicKeys(count: number = 5): Promise<PublicKey[]> {
  const keys: PublicKey[] = [];
  const curve = new EC('p256');
  
  for (let i = 0; i < count; i++) {
    const keyPair = curve.genKeyPair();
    keys.push({
      x: keyPair.getPublic().getX().toString('hex'),
      y: keyPair.getPublic().getY().toString('hex'),
      curve: 'p256'
    });
  }
  
  return keys;
}