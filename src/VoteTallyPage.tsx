import { useEffect, useState } from 'react';
import { Web3Service } from './web3/web3';
import { PKCCryptoHelper } from './crypto/PKCCryptoHelper';

export function VoteTallyPage() {
  const [privateKey, setPrivateKey] = useState('');
  const [voterId, setVoterId] = useState('');
  const [status, setStatus] = useState('');
  const [candidateList, setCandidateList] = useState<string[]>([]);
  const [winner, setWinner] = useState<string>('');

  const web3Service = new Web3Service();

  // Fetch candidate list from contract when page loads
  useEffect(() => {
    async function fetchCandidates() {
      try {
        const candidates: string[] = await web3Service.getAllCandidates();
        setCandidateList(candidates);
      } catch (error) {
        console.error("Error fetching candidates:", error);
      }
    }
    fetchCandidates();
  }, [web3Service]);

  const handleTallyVote = async () => {
    try {
      // Step 1: Sign the candidate name (message) using the provided private key.
      console.log("Step 1: Signing candidate message...");
      const signResult1 = await PKCCryptoHelper.signMessage(candidateList[0] /* dummy candidate */, privateKey);
      console.log("Candidate Signature:", signResult1.signature);

      // Step 2: Fetch Voting ID and create voteHash.
      console.log("Step 2: Fetching Voting ID from contract...");
      const votingId = await web3Service.getVotingId();
      console.log("Voting ID:", votingId);

      console.log("Step 2: Creating hash from candidate signature and voting ID...");
      const combined = signResult1.signature + votingId;
      const voteHash = await PKCCryptoHelper.createHash(combined);
      console.log("Computed Vote Hash:", voteHash);

      // Step 4: Fetch the registered voter data for this voter ID.
      console.log("Step 4: Fetching voter data from contract...");
      const voterData = await web3Service.getVoterData(Number(voterId));
      console.log("Fetched voterData.voteHash:", voterData.voteHash);

      let valid = false;
      if (voterData.voteHash === voteHash) {
        valid = true;
        console.log("Vote hash matches stored value – valid voter");
      } else {
        console.error("Vote hash mismatch – invalid voter");
        setStatus("Vote hash mismatch; vote not counted");
        return;
      }

      // Step 5: Loop through each candidate and verify signature.
      if (valid) {
        const registeredPublicKey = await web3Service.getRegisteredVoterPublicKey(Number(voterId));
        for (const candidate of candidateList) {
          console.log(`Verifying signature for candidate: ${candidate}`);
          const candidateValid = await PKCCryptoHelper.verifySignature(
            candidate, // candidate as message
            signResult1.signature, // using the signature generated earlier
            registeredPublicKey
          );
          if (candidateValid) {
            console.log(`Candidate ${candidate} verification successful`);
            // Call contract function to increment vote count for candidate.
            await web3Service.incrementVoteCount(Number(voterId), candidate);
            console.log(`Vote count incremented for candidate: ${candidate}`);
          } else {
            console.log(`Verification failed for candidate: ${candidate}`);
          }
        }
        setStatus("Vote tallying process completed successfully.");
      }
    } catch (error) {
      console.error("Error tallying vote:", error);
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleGetWinner = async () => {
    try {
      console.log("Fetching winner candidate...");
      const winningCandidate = await web3Service.getWinner();
      console.log("Winner candidate:", winningCandidate);
      setWinner(winningCandidate);
    } catch (error) {
      console.error("Error fetching winner:", error);
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="container">
      <h1>Vote Tally Page</h1>
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
          Voter Registration ID:
          <input
            type="number"
            value={voterId}
            onChange={(e) => setVoterId(e.target.value)}
          />
        </label>
        <label>
          Select Candidate:
          <select>
            {candidateList.map((cand, index) => (
              <option key={index} value={cand}>
                {cand}
              </option>
            ))}
          </select>
        </label>
        <button onClick={handleTallyVote}>Tally Vote</button>
        {status && <p>{status}</p>}
      </div>
      <div className="card">
        <button onClick={handleGetWinner}>Get Winner</button>
        {winner && <p>Winner Candidate: {winner}</p>}
      </div>
    </div>
  );
}