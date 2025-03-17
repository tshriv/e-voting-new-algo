// Language: TypeScript (TSX)
import { useState } from 'react';
import { Web3Service } from './web3/web3';

export function VotingResultPage() {
  const web3Service = new Web3Service();
  const [winner, setWinner] = useState<string>('');

  const handleGetWinner = async () => {
    try {
      console.log("Fetching winner candidate...");
      const winningCandidate = await web3Service.getWinner();
      console.log("Winner candidate:", winningCandidate);
      setWinner(winningCandidate);
    } catch (error) {
      console.error("Error fetching winner:", error);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Voting Result</h2>
      </div>
       
      <div className="card" style={{ border: "0"}}>
        <button onClick={handleGetWinner}>Get Winner</button>
        {winner && <p>Winner Candidate: {winner}</p>}
      </div>    
      
    </div>
  );
}