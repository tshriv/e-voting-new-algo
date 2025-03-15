// Language: TypeScript (TSX)
import { useState } from 'react';
import { Web3Service } from './web3/web3';
import { PKCCryptoHelper } from './crypto/PKCCryptoHelper';

export function VoteCastingPage() {
  const [privateKey, setPrivateKey] = useState('');
  const [voteCandidate, setVoteCandidate] = useState('');
  const [voterId, setVoterId] = useState('');
  const [status, setStatus] = useState('');
  const [signature, setSignature] = useState(''); // Add this state
  const web3Service = new Web3Service();

  const handleCopySignature = async () => {
    try {
      await navigator.clipboard.writeText(signature);
      alert("Signature copied to clipboard!");
    } catch (err) {
      alert("Failed to copy signature.");
    }
  };

  const handleCastVote = async () => {
    try {
      console.log("Step 1: Signing candidate name...");
      const signResult1 = await PKCCryptoHelper.signMessage(voteCandidate, privateKey);
      console.log("Candidate Signature:", signResult1.signature);
      setSignature(signResult1.signature); // Save signature for copying

      console.log("Step 2: Fetching Voting ID from contract...");
      const votingId = await web3Service.getVotingId();
      console.log("Voting ID:", votingId);

      console.log("Step 2: Creating hash from candidate signature and voting ID...");
      const combined = signResult1.signature + votingId;
      const voteHash = await PKCCryptoHelper.createHash(combined);
      console.log("Vote Hash:", voteHash);

      console.log("Step 3: Signing vote hash with private key...");
      const signResult2 = await PKCCryptoHelper.signMessage(voteHash, privateKey);
      console.log("Signature for Vote Hash:", signResult2.signature);

      console.log("Step 4: Fetching voter public key from contract...");
      const voterPublicKey = await web3Service.getRegisteredVoterPublicKey(Number(voterId));
      console.log("Voter Public Key:", voterPublicKey);

      console.log("Step 4: Verifying vote hash signature...");
      const isValid = await PKCCryptoHelper.verifySignature(
        voteHash,
        signResult2.signature,
        voterPublicKey
      );
      console.log("Verification result:", isValid);

      if (!isValid) {
        setStatus("Signature verification failed");
        return;
      }

      console.log("Step 5: Modifying vote hash on blockchain...");
      const modifyResult = await web3Service.modifyVoteHash(Number(voterId), voteHash);
      console.log("modifyVoteHash result:", modifyResult);

      setStatus(`Vote cast successfully – vote hash updated for voter ID ${voterId}`);
    } catch (error) {
      console.error("Error casting vote:", error);
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <label>
          Private Key:
          <input
            type="text"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
          />
        </label>
        <label>
          Candidate Name:
          <input
            type="text"
            value={voteCandidate}
            onChange={(e) => setVoteCandidate(e.target.value)}
          />
        </label>
        <label>
          Voter Registration ID:
          <input
            type="number"
            value={voterId}
            onChange={(e) => setVoterId(e.target.value)}
          />
        </label>
        <button onClick={handleCastVote}>Cast Vote</button>
        {signature && (
          <div style={{ marginTop: '1rem' }}>
            <h3>Your Vote Signature</h3>
            <textarea readOnly value={signature} style={{ width: '100%', height: '100px' }} />
            <button onClick={handleCopySignature}>Copy Signature</button>
          </div>
        )}
        {status && <p>{status}</p>}
      </div>
    </div>
  );
}