import { ec as EC } from 'elliptic';
import { sha3_256 } from 'js-sha3';
import BN from 'bn.js';
import { ECPoint, PrivateKey, PublicKey, Signature } from './types';

export class RingSignature {
    private curve: EC;

    constructor() { this.curve = new EC('p256'); }

    // Computes a challenge from the message and an EC point, as H(m, L)
    private generateChain(message: Uint8Array, L: ECPoint): Uint8Array {
        const hash = sha3_256.create();
        hash.update(message);
        hash.update(this.hexToBytes(L.getX().toString('hex')));
        hash.update(this.hexToBytes(L.getY().toString('hex')));
        return new Uint8Array(hash.digest());
    }

    // Helper to convert hex string to Uint8Array
    private hexToBytes(hex: string): Uint8Array {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
        }
        return bytes;
    }

    async create(privateKey: PrivateKey, publicKeys: PublicKey[], message: Uint8Array): Promise<Signature> {
        console.log("arguments : ", "private key :", privateKey, "public Key :", publicKeys,"message :", message);
        if (!privateKey || !publicKeys || !message) { throw new Error('Missing required parameters'); }
        const n = publicKeys.length;
        const signerIndex = publicKeys.findIndex(
            pk => pk.x === privateKey.publicKey.x && pk.y === privateKey.publicKey.y
        );

        if (signerIndex === -1) {
            throw new Error('Signer public key not found in ring');
        }

        // Generate key image
        const keyImage = this.generateKeyImage(privateKey);

        // Initialize arrays for challenges c and responses r and commitments L
        const c: BN[] = new Array(n);
        const r: BN[] = new Array(n);
        const L: ECPoint[] = new Array(n);

        // For all i ≠ signerIndex choose random r[i]
        for (let i = 0; i < n; i++) {
            if (i === signerIndex) continue;
            r[i] = new BN(this.curve.genKeyPair().getPrivate().toArray());
        }

        // Choose random u for the signer
        const u = new BN(this.curve.genKeyPair().getPrivate().toArray());

        // First commitment for signer: L[signerIndex] = g * u
        L[signerIndex] = this.curve.g.mul(u);

        // Start chaining from (signerIndex+1) mod n.
        // First challenge: c[(signerIndex+1) mod n] = H(m, L[signerIndex])
        const nextIdx = (signerIndex + 1) % n;
        c[nextIdx] = new BN(this.generateChain(message, L[signerIndex]));

        // Now loop around the ring
        for (let k = 1; k < n; k++) {
            const i = (signerIndex + k) % n;
            // Get corresponding public key point
            const pubPoint = this.curve
                .keyFromPublic({ x: publicKeys[i].x, y: publicKeys[i].y }, 'hex')
                .getPublic();

            // Compute commitment L[i] = g*r[i] + pub[i]*c[i]
            L[i] = this.curve.g.mul(r[i]).add(pubPoint.mul(c[i]));

            // Next challenge: c[(i+1) mod n] = H(m, L[i])
            const next = (i + 1) % n;
            c[next] = new BN(this.generateChain(message, L[i]));
        }

        // Now, the chain has wrapped so that c[signerIndex] is computed.
        // Solve for signer’s response: r[signerIndex] = u - d * c[signerIndex] mod order
        if (!this.curve.n) {
            throw new Error('Curve order not properly initialized');
        }
        r[signerIndex] = u.sub(privateKey.d.mul(c[signerIndex])).umod(this.curve.n);

        return {
            keyImage: {
                x: keyImage.x,
                y: keyImage.y
            },
            c,
            r
        };
    }

    async verify(
        signature: Signature,
        publicKeys: PublicKey[],
        message: Uint8Array,
        caseIdentifier?: Uint8Array
    ): Promise<boolean> {

        console.log("arguments : ", "signature :", signature, "public Keys :", publicKeys,"message :", message);
        const n = publicKeys.length;
        const cChain: BN[] = new Array(n);

        // Convert signature challenges back to BN if they're not already
        const challenges = signature.c.map(c => BN.isBN(c) ? c : new BN(c));
        const responses = signature.r.map(r => BN.isBN(r) ? r : new BN(r));

        // Reconstruct the challenge chain
        for (let i = 0; i < n; i++) {
            const pubPoint = this.curve
                .keyFromPublic({ x: publicKeys[i].x, y: publicKeys[i].y }, 'hex')
                .getPublic();

            const L_i = this.curve.g.mul(responses[i])
                .add(pubPoint.mul(challenges[i]));

            // Challenge for the next index
            cChain[(i + 1) % n] = new BN(this.generateChain(message, L_i));
        }

        // The chain should "close": the computed chain value at index 0 should equal the signature's c[0]
        for (let i = 0; i < n; i++) {
            if (!challenges[i].eq(cChain[i])) {
                return false;
            }
        }
        return true;
    }

    private generateKeyImage(privateKey: PrivateKey): { x: string; y: string } {
        const hexToBytes = (hex: string): Uint8Array => {
            const bytes = new Uint8Array(hex.length / 2);
            for (let i = 0; i < hex.length; i += 2) {
                bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
            }
            return bytes;
        };
        const h = this.hashToCurve(hexToBytes(privateKey.publicKey.x));
        const point = h.mul(privateKey.d);
        return {
            x: point.getX().toString('hex'),
            y: point.getY().toString('hex')
        };
    }
    private hashPoints(points: ECPoint[]): Uint8Array {
        const hash = sha3_256.create();
        const hexToBytes = (hex: string): Uint8Array => {
            const bytes = new Uint8Array(hex.length / 2);
            for (let i = 0; i < hex.length; i += 2) {
                bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
            }
            return bytes;
        };
        points.forEach(p => {
            hash.update(hexToBytes(p.getX().toString('hex')));
            hash.update(hexToBytes(p.getY().toString('hex')));
        });
        return new Uint8Array(hash.digest());
    }

    private hashToCurve(input: Uint8Array): ECPoint {
        const hash = sha3_256.create(); hash.update(input);
        const hashValue = new BN(hash.digest());
        return this.curve.g.mul(hashValue);
    }
}