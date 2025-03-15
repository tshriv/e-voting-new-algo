import { useState } from 'react';
import './App.css';
import { PKCCryptoHelper } from './crypto/PKCCryptoHelper';
import { Web3Service } from './web3/web3';
import { RegistrationPhase2 } from './RegistrationPhase2';
import { VoteCastingPage } from './VoteCastingPage';

function App() {
  const [page, setPage] = useState<'phase1' | 'phase2' | 'vote' | "tally">('phase1');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const [candidatesInput, setCandidatesInput] = useState<string>("");
  const [randomNumber, setRandomNumber] = useState<number>(0);
  const [votingId, setVotingId] = useState<string>("");

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
        voterPubStr, // message
        signature,   // signature
        govPubStr    // public key
      );

      if (!isValid) {
        setStatus('Invalid signature');
        return;
      }else{
        console.log("Signature is valid");
      }

      const pubKeyInEliptic = PKCCryptoHelper.convertJwkToElliptic(JSON.parse(voterPubStr));
      const voterPubKey = pubKeyInEliptic.publicKey;
      // Convert JWK to elliptic curve format for using it as folded public key
      voterPubStr = JSON.stringify(voterPubKey);   
      console.log("before adding public key to folded key , public key is ",voterPubStr);   
      await web3Service.addVoterPublicKey(voterPubStr);
      setStatus('Registration successful!');
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

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
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (page === 'phase2') {
    return <RegistrationPhase2 />;
  }

  if (page === 'vote') {
    return <VoteCastingPage />;
  }

  if (page === 'tally') {
    return <VoteCastingPage />;
  }
  return (
    <div className="container">
      <h1>Voter Registration</h1>
      <div className="card">
        <input
          type="file"
          accept=".json"
          onChange={handleFileChange}
        />
        <button
          onClick={verifyAndRegister}
          disabled={!file}
        >
          Verify and Register
        </button>
      </div>

      <h1>Set Voting Parameters</h1>
      <div className="card">
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
      </div>

      <div className="card">
        <button onClick={() => setPage('phase2')}>
          Registration Phase - 2
        </button>
      </div>
      
      <div className="card">
        <button onClick={() => setPage('vote')}>
          Cast Vote Page
        </button>
      </div>

      <div className="card">
        <button onClick={() => setPage('tally')}>
         Vote Tally Page
        </button>
      </div>

      {status && (
        <div className={`status ${status.includes('Error') ? 'error' : 'success'}`}>
          {status}
        </div>
      )}
    </div>
  );
}

export default App;
