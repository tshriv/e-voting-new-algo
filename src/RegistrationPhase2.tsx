import { useEffect, useState } from 'react';
import { Web3Service } from './web3/web3';
import { RingSignature } from './crypto/RingSignatureHelper';
import { PKCCryptoHelper } from './crypto/PKCCryptoHelper';

export function RegistrationPhase2() {
  const [voterPublicKeys, setVoterPublicKeys] = useState<string[]>([]);
  const [randomNumber, setRandomNumber] = useState<number | null>(null);
  const [certificatePrivateKey, setCertificatePrivateKey] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [generatedPrivateKey, setGeneratedPrivateKey] = useState<string>('');

  const web3Service = new Web3Service();

  useEffect(() => {
    async function fetchData() {
      try {
        const keys = await web3Service.getAllPublicKeys();
        const rnd = await web3Service.getRandomNumber();
        setVoterPublicKeys(keys);
        setRandomNumber(rnd);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
    fetchData();
  }, [web3Service]);

  const handleCopyPrivateKey = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrivateKey);
      alert("Private key copied to clipboard!");
    } catch (err) {
      alert("Failed to copy private key.");
    }
  };

  const handleRegister = async () => {
    try {
      if (!randomNumber) {
        setStatus("Random number not loaded yet.");
        return;
      }
      // Parse and convert certificate private key input to elliptic format.
      let privKeyData = JSON.parse(certificatePrivateKey.trim());
      privKeyData = PKCCryptoHelper.convertJwkToElliptic(privKeyData);

      // Use the fetched random number as the message.
      const messageStr = randomNumber.toString();
      const encoder = new TextEncoder();
      const messageBuffer = encoder.encode(messageStr);

      // Convert fetched public key JSON strings to objects.
      const publicKeyArray = voterPublicKeys.map((key) => {
        const jsonData = JSON.parse(key);
        return {
          x: jsonData.x,
          y: jsonData.y,
          curve: jsonData.crv 
            ? (jsonData.crv.toLowerCase() === 'p-256' ? 'p256' : jsonData.crv)
            : 'p256'
        };
      });

      // Create a ring signature using the RingSignature helper.
      const ringSigHelper = new RingSignature();
      const sig = await ringSigHelper.create(privKeyData, publicKeyArray, messageBuffer);

      // Format ring signature: convert BN challenges/responses to hex strings.
      const signature = {
        keyImage: sig.keyImage,
        c: sig.c.map(c => c.toString('hex')),
        r: sig.r.map(r => r.toString('hex'))
      };
      console.log("Signature created:", signature);

      // Verify the signature.
      const verified = await ringSigHelper.verify(sig, publicKeyArray, messageBuffer);
      if (!verified) {
        console.error("Signature verification failed");
        setStatus("Signature verification failed");
        return;
      }
      console.log("Signature verified");

      // Compare current signature's keyImage with stored signatures.
      const allSignatures = await web3Service.getAllSignatures();
      let alreadyRegistered = false;
      for (const sigStr of allSignatures) {
        try {
          const storedSig = JSON.parse(sigStr);
          if (
            storedSig.keyImage &&
            storedSig.keyImage.x === signature.keyImage.x &&
            storedSig.keyImage.y === signature.keyImage.y
          ) {
            alreadyRegistered = true;
            break;
          }
        } catch (parseError) {
          console.error("Error parsing stored signature:", parseError);
        }
      }

      if (alreadyRegistered) {
        setStatus("Voter already registered");
        alert("Voter already registered");
      } else {
        // Generate a new key pair using PKCCryptoHelper.
        const generatedKeyPair = await PKCCryptoHelper.generateKeyPair();
        const generatedPublicKey = generatedKeyPair.publicKey;
        const genPrivateKey = generatedKeyPair.privateKey;
        
        // Format signature as JSON string.
        const sigStr = JSON.stringify(signature);
        
        // Call smart contract to register voter data.
        const index = await web3Service.addVoterData(generatedPublicKey, sigStr, "null");
        console.log("Voter registered");
        setStatus(`Verification success – voter registered (Voting Index: ${index})`);
        setGeneratedPrivateKey(genPrivateKey);
        alert(`Voter Registered! Voting Index: ${index}. Please store your private key securely.`);
      }
    } catch (error) {
      console.error("Error during registration phase 2:", error);
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Voter Registration Phase 2</h2>
        <span className="phase-badge">Phase 2</span>
      </div>
      {/* <div>
        <p>
          <strong>Registered Public Keys:</strong> {voterPublicKeys.join(', ')}
        </p>
        <p>
          <strong>Random Number:</strong> {randomNumber !== null ? randomNumber : 'Loading...'}
        </p>
      </div> */}
      <div>
        <label>
         Gov Certificate Private Key:
          <input 
            type="text"
            value={certificatePrivateKey}
            onChange={(e) => setCertificatePrivateKey(e.target.value)}
          />
        </label>
      </div>
      <button onClick={handleRegister}>Register</button>
      {status && <p>{status}</p>}
      {generatedPrivateKey && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Your Generated Private Key</h3>
          <textarea readOnly value={generatedPrivateKey} style={{ width: '100%', height: '100px' }} />
          <button onClick={handleCopyPrivateKey} style={{ marginTop: '0.5rem' }}>
            Copy Private Key
          </button>
        </div>
      )}
    </div>
  );
}