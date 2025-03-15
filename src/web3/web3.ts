import { ethers } from 'ethers';
import contractABI from '../contract/e_voting.json';

declare global {
  interface Window {
    ethereum: ethers.providers.ExternalProvider;
  }
}

export class Web3Service {
  private contract: ethers.Contract;
  private provider: ethers.providers.Web3Provider;
  private contractAddress: string = "0x405dbFf41E38f96AD5F15f623AA1795dfD7bD973";

  constructor() {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed!");
    }
    this.provider = new ethers.providers.Web3Provider(window.ethereum);
    this.contract = new ethers.Contract(
      this.contractAddress,
      contractABI,
      this.provider.getSigner()
    );
  }

  async connectWallet() {
    try {
      await this.provider.send("eth_requestAccounts", []);
      return await this.provider.getSigner().getAddress();
    } catch (error) {
      console.error("User rejected the connection request");
      throw error;
    }
  }

  async addVoterPublicKey(publicKey: string) {
    try {
      await this.connectWallet();
      const signer = this.provider.getSigner();
      const contractWithSigner = this.contract.connect(signer);
      const transaction = await contractWithSigner.addVoterPublicKey(publicKey);
      const receipt = await transaction.wait();
      return receipt;
    } catch (error) {
      console.error("Error adding voter public key:", error);
      throw error;
    }
  }

  async setVotingParameters(candidateList: string[], randomNumber: number, votingId: string) {
    try {
      await this.connectWallet();
      const signer = this.provider.getSigner();
      const contractWithSigner = this.contract.connect(signer);
      const transaction = await contractWithSigner.setVotingParameters(candidateList, randomNumber, votingId);
      const receipt = await transaction.wait(); // Wait for transaction mining
      return receipt;
    } catch (error) {
      console.error("Error setting voting parameters:", error);
      throw error;
    }
  }

  async getRegisteredVoterPublicKey(index: number): Promise<string> {
    try {
      await this.connectWallet();
      const result = await this.contract.getRegisteredVoterPublicKey(index);
      return result;
    } catch (error) {
      console.error("Error getting voter public key:", error);
      throw error;
    }
  }

  async getAllPublicKeys(): Promise<string[]> {
    try {
      await this.connectWallet();
      const result: string[] = await this.contract.getAllPublicKeys();
      return result;
    } catch (error) {
      console.error("Error getting all public keys:", error);
      throw error;
    }
  }

  async getRandomNumber(): Promise<number> {
    try {
      await this.connectWallet();
      const result = await this.contract.getRandomNumber();
      // Convert BigNumber to number if needed
      return Number(result);
    } catch (error) {
      console.error("Error getting random number:", error);
      throw error;
    }
  }

  async getAllSignatures(): Promise<string[]> {
    try {
      await this.connectWallet();
      const result: string[] = await this.contract.getAllSignatures();
      return result;
    } catch (error) {
      console.error("Error getting all signatures:", error);
      throw error;
    }
  }

  async addVoterData(publicKey: string, signature: string, voteHash: string): Promise<number> {
    try {
      await this.connectWallet();
      const signer = this.provider.getSigner();
      const contractWithSigner = this.contract.connect(signer);
      // Call static first to get the index return value (if desired)
      const index: number = await contractWithSigner.callStatic.addVoterData(publicKey, signature, voteHash);
      const transaction = await contractWithSigner.addVoterData(publicKey, signature, voteHash);
      await transaction.wait();
      return index;
    } catch (error) {
      console.error("Error adding voter data:", error);
      throw error;
    }
  }

  async modifyVoteHash(index: number, voteHash: string): Promise<boolean> {
    try {
      await this.connectWallet();
      const signer = this.provider.getSigner();
      const contractWithSigner = this.contract.connect(signer);
      const transaction = await contractWithSigner.modifyVoteHash(index, voteHash);
      const receipt = await transaction.wait();
      return receipt;
    } catch (error) {
      console.error("Error modifying vote hash:", error);
      throw error;
    }
  }

  async getVotingId(): Promise<string> {
    try {
      await this.connectWallet();
      const result: string = await this.contract.getVotingId();
      return result;
    } catch (error) {
      console.error("Error getting voting ID:", error);
      throw error;
    }
  }

  async getVoterData(index: number): Promise<{ publicKey: string; signature: string; voteHash: string; isVoteCounted: boolean }> {
    try {
      await this.connectWallet();
      const result = await this.contract.getVoterData(index);
      return result;
    } catch (error) {
      console.error("Error getting voter data:", error);
      throw error;
    }
  }

  async incrementVoteCount(index: number, candidate: string): Promise<boolean> {
    try {
      await this.connectWallet();
      const signer = this.provider.getSigner();
      const contractWithSigner = this.contract.connect(signer);
      const transaction = await contractWithSigner.incrementVoteCount(index, candidate);
      const receipt = await transaction.wait();
      return receipt;
    } catch (error) {
      console.error("Error incrementing vote count:", error);
      throw error;
    }
  }

  async getWinner(): Promise<string> {
    try {
      await this.connectWallet();
      const result: string = await this.contract.getWinner();
      return result;
    } catch (error) {
      console.error("Error getting winner:", error);
      throw error;
    }
  }

  async getAllCandidates(): Promise<string[]> {
    try {
      await this.connectWallet();
      const candidates: string[] = await this.contract.getAllCandidates();
      return candidates;
    } catch (error) {
      console.error("Error getting all candidates:", error);
      throw error;
    }
  }

  async setPhase(phase: number): Promise<boolean> {
    try {
      await this.connectWallet();
      const signer = this.provider.getSigner();
      const contractWithSigner = this.contract.connect(signer);
      const transaction = await contractWithSigner.setPhase(phase);
      const receipt = await transaction.wait();
      return receipt;
    } catch (error) {
      console.error("Error setting phase:", error);
      throw error;
    }
  }

  async getPhase(): Promise<number> {
    try {
      await this.connectWallet();
      const phase: number = await this.contract.getPhase();
      return phase;
    } catch (error) {
      console.error("Error getting phase:", error);
      throw error;
    }
  }

}