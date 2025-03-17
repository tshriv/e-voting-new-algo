import { useEffect, useState } from 'react';
import './App.css';
import { Web3Service } from './web3/web3';
import { RegistrationPhase2 } from './RegistrationPhase2';
import { VoteCastingPage } from './VoteCastingPage';
import { InitialRegistrationPhase } from './components/initialRegistrationPhase';
import { ParamSetPhase } from './components/ParamSetPhase';
import { VoteTallyPage } from './VoteTallyPage';
import { BigNumber } from 'ethers';
import { VotingResultPage } from './VotingResultPage';

function App() {

  
  const [currentPhase, setCurrentPhase] = useState<number | null>(null);


  const web3Service = new Web3Service();


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

  const getPhaseTitle = (phase: number): string => {
    switch (phase) {
      case 0:
        return "Initial Setup - Set Voting Parameters";
      case 1:
        return "Voter Registration Phase 1";
      case 2:
        return "Voter Registration Phase 2";
      case 3:
        return "Vote Casting";
      case 4:
        return "Vote Tallying";
      case 5:
        return "Results";
      default:
        return "Unknown Phase";
    }
  };

   // UI for each phase
   const renderPhaseUI = () => {
    if (currentPhase === null) {
      return <p>Loading phase...</p>;
    }
    switch (BigNumber.from(currentPhase).toNumber()) {
      case 0:
        return (
          <div >
            <ParamSetPhase onPhaseUpdate={updatePhase} />
          </div>
        );
      case 1:
        return (
          <div>
            <InitialRegistrationPhase />
          </div>
        );
      case 2:
        return (
          <div>
            <RegistrationPhase2 />
          </div>
        );
      case 3:
        return (
          <div>
            <VoteCastingPage />
          </div>
        );
        case 4:
          return (
            <div>
              <VoteTallyPage />
            </div>
          );

          case 5:
            return (
              <div>
              <VotingResultPage/>
            </div>
            );
      default:
        return <p>Invalid phase</p>;
    }
  };
  return (
  <div>
    <header className="app-header">
      <h1>E-Voting System</h1>
      <div className="phase-indicator">
        {currentPhase !== null ? getPhaseTitle(BigNumber.from(currentPhase).toNumber()) : 'Loading...'}
      </div>
    </header>

    <main className="container">
      <div className="phase-component">
        {renderPhaseUI()}
      </div>
    </main>
  </div>
  );

}

export default App;
