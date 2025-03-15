// src/components/RingSignatureForm.tsx
import React, { useState } from 'react';
import { RingSignature } from '../crypto/ringSignature';
import { generateTestPrivateKey, generateTestPublicKeys } from '../crypto/testUtils';
import { PublicKey, PrivateKey } from '../crypto/types';
import BN from 'bn.js';

export const RingSignatureForm: React.FC = () => {
  // Existing state variables
  const [keyPairs, setKeyPairs] = useState<Array<{private: PrivateKey, public: PublicKey}>>([]);
  const [foldedKeys, setFoldedKeys] = useState<string>('');
  const [message, setMessage] = useState('');
  const [selectedPrivateKey, setSelectedPrivateKey] = useState('');
  const [signature, setSignature] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);

  // New state variables for verification inputs
  const [verifyMessage, setVerifyMessage] = useState('');
  const [verifySignature, setVerifySignature] = useState('');
  const [verifyFoldedKeys, setVerifyFoldedKeys] = useState('');

  // New state variables for linkability check
  const [signature1, setSignature1] = useState('');
  const [signature2, setSignature2] = useState('');
  const [linkabilityResult, setLinkabilityResult] = useState<boolean | null>(null);

  // Generate new key pair
  const handleGenerateKeyPair = async () => {
    const privateKey = await generateTestPrivateKey();
    setKeyPairs([...keyPairs, {
      private: privateKey,
      public: privateKey.publicKey
    }]);
  };

  // Generate folded key from all public keys
  const handleFoldKeys = () => {
    const publicKeys = keyPairs.map(pair => pair.public);
    setFoldedKeys(JSON.stringify(publicKeys));
  };

  // Sign message
  const handleSign = async () => {
    try {
      const signer = new RingSignature();
      const selectedKeyPair = keyPairs.find(
        pair => JSON.stringify(pair.private) === selectedPrivateKey
      );

      if (!selectedKeyPair) {
        throw new Error('Please select a private key');
      }

      const publicKeys = JSON.parse(foldedKeys) as PublicKey[];
      
      const sig = await signer.create(
        selectedKeyPair.private,
        publicKeys,
        new TextEncoder().encode(message)
      );
      
      setSignature(JSON.stringify({
        signature: {
          keyImage: sig.keyImage,
          c: sig.c.map(c => c.toString('hex')),
          r: sig.r.map(r => r.toString('hex'))
        }
      }));
    } catch (err) {
      console.error('Signing failed:', err);
      alert('Signing failed: ' + err);
    }
  };

  // Modified verify handler
  const handleVerify = async () => {
    try {
      const signer = new RingSignature();
      const parsedSig = JSON.parse(verifySignature);
      const publicKeys = JSON.parse(verifyFoldedKeys) as PublicKey[];
      
      const deserializedSig = {
        keyImage: parsedSig.signature.keyImage,
        c: parsedSig.signature.c.map((c: string) => new BN(c, 'hex')),
        r: parsedSig.signature.r.map((r: string) => new BN(r, 'hex'))
      };
      
      const isValid = await signer.verify(
        deserializedSig,
        publicKeys,
        new TextEncoder().encode(verifyMessage)
      );
      
      setVerificationResult(isValid);
    } catch (err) {
      console.error('Verification failed:', err);
      alert('Verification failed: ' + err);
    }
  };

  // New handler for linkability check
  const handleCheckLinkability = () => {
    try {
      const sig1 = JSON.parse(signature1);
      const sig2 = JSON.parse(signature2);
      
      // Compare key images to check if signatures were created by the same signer
      const isSameSigner = 
        sig1.signature.keyImage.x === sig2.signature.keyImage.x && 
        sig1.signature.keyImage.y === sig2.signature.keyImage.y;
      
      setLinkabilityResult(isSameSigner);
    } catch (err) {
      console.error('Linkability check failed:', err);
      alert('Linkability check failed: ' + err);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Ring Signature Demo</h2>

      {/* Key Generation Section */}
      <div style={{ marginBottom: '20px' }}>
        <h3>1. Generate Key Pairs</h3>
        <button onClick={handleGenerateKeyPair}>Generate New Key Pair</button>
        <div style={{ marginTop: '10px' }}>
          <h4>Generated Key Pairs:</h4>
          {keyPairs.map((pair, index) => (
            <div key={index} style={{ marginBottom: '10px', fontSize: '12px' }}>
              <div>Pair {index + 1}:</div>
              <div>Public Key: {JSON.stringify(pair.public)}</div>
              <div>Private Key: {JSON.stringify(pair.private)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Folded Keys Section */}
      <div style={{ marginBottom: '20px' }}>
        <h3>2. Generate Folded Keys</h3>
        <button onClick={handleFoldKeys}>Fold Public Keys</button>
        {foldedKeys && (
          <div style={{ marginTop: '10px' }}>
            <h4>Folded Keys:</h4>
            <pre style={{ overflow: 'auto', maxHeight: '100px' }}>
              {foldedKeys}
            </pre>
          </div>
        )}
      </div>

      {/* Signing Section */}
      <div style={{ marginBottom: '20px' }}>
        <h3>3. Sign Message</h3>
        <div>
          <select 
            value={selectedPrivateKey} 
            onChange={(e) => setSelectedPrivateKey(e.target.value)}
            style={{ marginBottom: '10px', width: '100%' }}
          >
            <option value="">Select a private key...</option>
            {keyPairs.map((pair, index) => (
              <option key={index} value={JSON.stringify(pair.private)}>
                Private Key {index + 1}
              </option>
            ))}
          </select>
        </div>
        <div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter message to sign"
            style={{ width: '100%', minHeight: '100px', marginBottom: '10px' }}
          />
        </div>
        <button onClick={handleSign}>Sign Message</button>
        {signature && (
          <div style={{ marginTop: '10px' }}>
            <h4>Generated Signature:</h4>
            <pre style={{ overflow: 'auto', maxHeight: '100px' }}>
              {signature}
            </pre>
          </div>
        )}
      </div>

      {/* Modified Verification Section */}
      <div style={{ marginBottom: '20px' }}>
        <h3>4. Verify Signature</h3>
        <div>
          <textarea
            value={verifyMessage}
            onChange={(e) => setVerifyMessage(e.target.value)}
            placeholder="Enter message to verify"
            style={{ width: '100%', minHeight: '50px', marginBottom: '10px' }}
          />
          <textarea
            value={verifySignature}
            onChange={(e) => setVerifySignature(e.target.value)}
            placeholder="Enter signature to verify"
            style={{ width: '100%', minHeight: '100px', marginBottom: '10px' }}
          />
          <textarea
            value={verifyFoldedKeys}
            onChange={(e) => setVerifyFoldedKeys(e.target.value)}
            placeholder="Enter folded public keys"
            style={{ width: '100%', minHeight: '100px', marginBottom: '10px' }}
          />
        </div>
        <button onClick={handleVerify}>Verify</button>
        {verificationResult !== null && (
          <div style={{ marginTop: '10px' }}>
            <h4>Verification Result:</h4>
            <p style={{ color: verificationResult ? 'green' : 'red' }}>
              {verificationResult ? 'Valid' : 'Invalid'}
            </p>
          </div>
        )}
      </div>

      {/* New Linkability Check Section */}
      <div style={{ marginBottom: '20px' }}>
        <h3>5. Check Linkability</h3>
        <div>
          <textarea
            value={signature1}
            onChange={(e) => setSignature1(e.target.value)}
            placeholder="Enter first signature"
            style={{ width: '100%', minHeight: '100px', marginBottom: '10px' }}
          />
          <textarea
            value={signature2}
            onChange={(e) => setSignature2(e.target.value)}
            placeholder="Enter second signature"
            style={{ width: '100%', minHeight: '100px', marginBottom: '10px' }}
          />
        </div>
        <button onClick={handleCheckLinkability}>Check Linkability</button>
        {linkabilityResult !== null && (
          <div style={{ marginTop: '10px' }}>
            <h4>Linkability Result:</h4>
            <p style={{ color: linkabilityResult ? 'orange' : 'blue' }}>
              {linkabilityResult 
                ? 'Both signatures were created by the same signer' 
                : 'Signatures were created by different signers'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};