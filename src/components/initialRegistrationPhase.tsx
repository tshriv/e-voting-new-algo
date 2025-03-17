import { useState } from 'react';
import { Web3Service } from '../web3/web3';
import { PKCCryptoHelper } from '../crypto/PKCCryptoHelper';

export function InitialRegistrationPhase() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const web3Service = new Web3Service();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const verifyAndRegister = async () => {
    if (!file) {
      setStatus('Please select a file');
      return;
    }

    try {
      const fileContent = await file.text();
      const certData = JSON.parse(fileContent);
      const { gov_pub, voter_pub, signature } = certData;
      const govPubStr = JSON.stringify(gov_pub);
      let voterPubStr = JSON.stringify(voter_pub);

      const isValid = await PKCCryptoHelper.verifySignature(
        voterPubStr,
        signature,
        govPubStr
      );

      if (!isValid) {
        setStatus('Invalid signature');
        return;
      }

      const pubKeyInEliptic = PKCCryptoHelper.convertJwkToElliptic(JSON.parse(voterPubStr));
      const voterPubKey = pubKeyInEliptic.publicKey;
      voterPubStr = JSON.stringify(voterPubKey);
      await web3Service.addVoterPublicKey(voterPubStr);
      setStatus('Registration successful!');
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Voter Registration</h2>
        <span className="phase-badge">Phase 1</span>
      </div>
      <div className="file-input-container">
        <label htmlFor="gov-cert">
          Government Authorised ID Certificate:
          <input
            id="gov-cert"
            type="file"
            accept=".json"
            onChange={handleFileChange}
          />
        </label>
      </div>
      <button
        onClick={verifyAndRegister}
        disabled={!file}
      >
        Verify and Register
      </button>
      {status && <p className={status.includes('Error') ? 'error' : 'success'}>{status}</p>}
    </div>
  );
}