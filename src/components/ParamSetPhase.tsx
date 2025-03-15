import { useState } from 'react';
import { Web3Service } from '../web3/web3';

interface ParamSetPhaseProps {
  onPhaseUpdate: () => Promise<void>;
}


export function ParamSetPhase({ onPhaseUpdate }: ParamSetPhaseProps) {
  const [status, setStatus] = useState<string>('');
  const [candidatesInput, setCandidatesInput] = useState<string>("");
  const [randomNumber, setRandomNumber] = useState<number>(0);
  const [votingId, setVotingId] = useState<string>("");
  const web3Service = new Web3Service();

 

  const handleSetVotingParameters = async () => {
    try {
      const candidateList = candidatesInput.split(',')
        .map(candidate => candidate.trim())
        .filter(candidate => candidate.length > 0);

      if (candidateList.length === 0) {
        setStatus('Candidate list cannot be empty');
        return;
      }
      if (!votingId) {
        setStatus('Voting ID is required');
        return;
      }

      await web3Service.setVotingParameters(candidateList, randomNumber, votingId);
      setStatus('Voting parameters set successfully!');
      
      // Call the parent's update function instead of just getPhase()
      await onPhaseUpdate();
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="card">
      <h2>Set Voting Parameters</h2>
      <label>
        Candidate List (comma separated):
        <input
          type="text"
          value={candidatesInput}
          onChange={(e) => setCandidatesInput(e.target.value)}
          placeholder="Candidate1, Candidate2, Candidate3"
        />
      </label>
      <br />
      <label>
        Random Number:
        <input
          type="number"
          value={randomNumber}
          onChange={(e) => setRandomNumber(Number(e.target.value))}
        />
      </label>
      <br />
      <label>
        Voting ID:
        <input
          type="text"
          value={votingId}
          onChange={(e) => setVotingId(e.target.value)}
          placeholder="Voting ID"
        />
      </label>
      <br />
      <button
        onClick={handleSetVotingParameters}
        disabled={!candidatesInput || !votingId}
      >
        Set Voting Parameters
      </button>
      {status && <p className={status.includes('Error') ? 'error' : 'success'}>{status}</p>}
    </div>
  );
}