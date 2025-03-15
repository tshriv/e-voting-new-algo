import { useEffect, useState } from 'react';
import './App.css';
import { Web3Service } from './web3/web3';
import { RegistrationPhase2 } from './RegistrationPhase2';
import { VoteCastingPage } from './VoteCastingPage';
import { InitialRegistrationPhase } from './components/initialRegistrationPhase';
import { ParamSetPhase } from './components/ParamSetPhase';
import { VoteTallyPage } from './VoteTallyPage';
import { BigNumber } from 'ethers';

function App() {

  const [winner, setWinner] = useState<string>('');
  const [currentPhase, setCurrentPhase] = useState<number | null>(null);


  const web3Service = new Web3Service();

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

  const updatePhase = async () => {
    try {
      const phase = await web3Service.getPhase();
      setCurrentPhase(phase);
      console.log("Updated Phase:", phase);
    } catch (error) {
      console.error("Error retrieving phase:", error);
    }
  };

   // On mount, load the current phase from the contract
   useEffect(() => {
    (async () => {
      try {
        const phase = await web3Service.getPhase();
        setCurrentPhase(phase);
        console.log("Loaded Phase:", phase);
      } catch (error) {
        console.error("Error retrieving phase:", error);
      }
    })();
  }, []);


  // return (
  //   <div className="container">
  //     <h1>Voter Registration</h1>
  //     <InitialRegistrationPhase />

  //     <h1>Set Voting Parameters</h1>
  //     <div className="card">
  //       <label>
  //         Candidate List (comma separated):
  //         <input
  //           type="text"
  //           value={candidatesInput}
  //           onChange={(e) => setCandidatesInput(e.target.value)}
  //           placeholder="Candidate1, Candidate2, Candidate3"
  //         />
  //       </label>
  //       <br />
  //       <label>
  //         Random Number:
  //         <input
  //           type="number"
  //           value={randomNumber}
  //           onChange={(e) => setRandomNumber(Number(e.target.value))}
  //         />
  //       </label>
  //       <br />
  //       <label>
  //         Voting ID:
  //         <input
  //           type="text"
  //           value={votingId}
  //           onChange={(e) => setVotingId(e.target.value)}
  //           placeholder="Voting ID"
  //         />
  //       </label>
  //       <br />
  //       <button
  //         onClick={handleSetVotingParameters}
  //         disabled={!candidatesInput || !votingId}
  //       >
  //         Set Voting Parameters
  //       </button>
  //     </div>

  //     <div className="card">
  //       <button onClick={() => setPage('phase2')}>
  //         Registration Phase - 2
  //       </button>
  //     </div>
      
  //     <div className="card">
  //       <button onClick={() => setPage('vote')}>
  //         Cast Vote Page
  //       </button>
  //     </div>

  //     <div className="card">
  //       <button onClick={() => setPage('tally')}>
  //        Vote Tally Page
  //       </button>
  //     </div>

  //     {status && (
  //       <div className={`status ${status.includes('Error') ? 'error' : 'success'}`}>
  //         {status}
  //       </div>
  //     )}
  //   </div>
  // );

   // UI for each phase
   const renderPhaseUI = () => {
    if (currentPhase === null) {
      return <p>Loading phase...</p>;
    }
    switch (BigNumber.from(currentPhase).toNumber()) {
      case 0:
        return (
          <div>
            <h1>Set Vote Parameter</h1>
            <ParamSetPhase onPhaseUpdate={updatePhase} />
          </div>
        );
      case 1:
        return (
          <div>
            <h1>Registration Phase 1</h1>
            <InitialRegistrationPhase />
          </div>
        );
      case 2:
        return (
          <div>
            <h1>Registration Phase 2</h1>
            <RegistrationPhase2 />
          </div>
        );
      case 3:
        return (
          <div>
            <h1>Cast Vote</h1>
            <VoteCastingPage />
          </div>
        );
        case 4:
          return (
            <div>
              <h1>Vote Tally</h1>
              <VoteTallyPage />
            </div>
          );

          case 5:
            return (
              <div className="card">
        <button onClick={handleGetWinner}>Get Winner</button>
        {winner && <p>Winner Candidate: {winner}</p>}
      </div>
            );
      default:
        return <p>Invalid phase</p>;
    }
  };
  return (
  <div className="container">
    <h1>e-Voting System</h1>
    <h3>Current Phase: {currentPhase !== null ? BigNumber.from(currentPhase).toNumber() : 'Loading...'}</h3>
    {renderPhaseUI()}
  </div>
 
  );

}

export default App;
