// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title EVotingSystem
 * @dev Contract to manage voter government public keys and voting parameters for e-voting
 */
contract EVotingSystem {
    // Array to store voter government public keys
    string[] private voterGovPublicKeys;

    // Mapping to quickly check if a Gov public key has already been added.
    mapping(bytes32 => bool) private publicKeyExists;

    // Address of the contract owner/administrator
    address private owner;

    // Mapping to store vote counts for each candidate
    mapping(string => uint256) private candidateVotes;

// Phase tracking variable
    uint256 private currentPhase;

    // Structure to store voter data
      struct VoterData {
        string publicKey;
        string signature;
        string voteHash;
        bool isVoteCounted;
    }


    // Array to store voter data
    VoterData[] private voterDataArray;

    // New variables for voting configuration
    string[] private candidateList;
    uint256 private randomNumber;
    string private votingId;

    // Flag to track if voting parameters have been set
    bool private votingParamsSet;

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    /**
     * @dev Constructor sets the contract deployer as the owner
     */
    constructor() {
        owner = msg.sender;
        votingParamsSet = false;
        currentPhase = 0; // Initial phase before VotingParamSet
    }

    /**
     * @dev Returns all stored public keys.
     * @return An array containing all public keys.
     */
    function getAllPublicKeys() external view returns (string[] memory) {
        return voterGovPublicKeys;
    }

    /**
     * @dev Add a new voter government public key to the list.
     *      Checks for duplicates using a mapping.
     * @param _publicKey The public key to be added
     * @return success True if the public key was added successfully
     */
    function addVoterPublicKey(string memory _publicKey)
        external
        returns (bool success)
    {
        // Check that the public key is not empty
        require(bytes(_publicKey).length > 0, "Public key cannot be empty");

        // Generate a hash for the public key for constant-time lookup
        bytes32 keyHash = keccak256(abi.encodePacked(_publicKey));

        // Check if the public key already exists
        require(!publicKeyExists[keyHash], "Public key already exists");

        // Mark this public key as added in the mapping
        publicKeyExists[keyHash] = true;

        // Add the public key to the array
        voterGovPublicKeys.push(_publicKey); // Keeping as `string` for readability

        // Emit an event to log the addition
        // emit PublicKeyAdded(_publicKey, voterGovPublicKeys.length);

        return true;
    }

    /**
     * @dev Add a new voter with public key, signature, and voteHash
     * @param _publicKey The public key to be added
     * @param _signature The signature of the voter
     * @param _voteHash The voteHash cast by the voter
     * @return index The index at which the voter data was added
     */
    function addVoterData(
        string memory _publicKey,
        string memory _signature,
        string memory _voteHash
    ) external returns (uint256 index) {
        require(bytes(_publicKey).length > 0, "Public key cannot be empty");
        voterDataArray.push(VoterData({
            publicKey: _publicKey,
            signature: _signature,
            voteHash: _voteHash,
            isVoteCounted: false
        }));
        return voterDataArray.length - 1;
    }

    /**
     * @dev Modify only the voteHash for a voter
     * @param _index The index of the voter in the array
     * @param _voteHash New voteHash
     * @return success True if the voteHash was modified successfully
     */
    function modifyVoteHash(uint256 _index, string memory _voteHash)
        external
        returns (bool success)
    {
        require(_index < voterDataArray.length, "Index out of bounds");
        require(bytes(_voteHash).length > 0, "VoteHash cannot be empty");

        //check if already voted
        require(
            keccak256(abi.encodePacked(voterDataArray[_index].voteHash)) ==
                keccak256(abi.encodePacked("null")),
            "Voter has already voted"
        );

        // Update the voteHash
        voterDataArray[_index].voteHash = _voteHash;

        return true;
    }

    /**
     * @dev Get a specific voter data by index
     * @param _index The index of the voter in the array
     * @return voter The voter data at the specified index
     */
    function getVoterData(uint256 _index)
        external
        view
        returns (VoterData memory voter)
    {
        require(_index < voterDataArray.length, "Index out of bounds");
        return voterDataArray[_index];
    }

    /**
     * @dev Get all signatures from all voters
     * @return signatures Array of all signatures
     */
    function getAllSignatures()
        external
        view
        returns (string[] memory signatures)
    {
        string[] memory result = new string[](voterDataArray.length);

        for (uint256 i = 0; i < voterDataArray.length; i++) {
            result[i] = voterDataArray[i].signature;
        }

        return result;
    }

    /**
     * @dev Get all voteHashes from all voters
     * @return voteHashes Array of all voteHashes
     */
    function getAllVoteHashes()
        external
        view
        returns (string[] memory voteHashes)
    {
        string[] memory result = new string[](voterDataArray.length);

        for (uint256 i = 0; i < voterDataArray.length; i++) {
            result[i] = voterDataArray[i].voteHash;
        }

        return result;
    }

    /**
     * @dev Set the voting parameters (candidate list, random number, voting ID)
     * @param _candidateList Array of candidate names
     * @param _randomNumber Random number seed for the voting process
     * @param _votingId Unique identifier for this voting session
     * @return success True if the voting parameters were set successfully
     */
    function setVotingParameters(
        string[] calldata _candidateList,
        uint256 _randomNumber,
        string calldata _votingId
    ) external onlyOwner returns (bool success) {
        // Ensure this function can only be called once
        require(!votingParamsSet, "Voting parameters have already been set");

        // Validate inputs
        require(_candidateList.length > 0, "Candidate list cannot be empty");
        require(bytes(_votingId).length > 0, "Voting ID cannot be empty");

        // Set the voting parameters
        for (uint256 i = 0; i < _candidateList.length; i++) {
            candidateList.push(_candidateList[i]);
        }
        randomNumber = _randomNumber;
        votingId = _votingId;

        // Mark parameters as set to prevent future changes
        votingParamsSet = true;
        currentPhase = 1; // Phase after VotingParamSet

        return true;
    }

    /**
     * @dev Get the count of registered voter public keys
     * @return count The number of public keys in the list
     */
    function getVoterPublicKeyCount() external view returns (uint256 count) {
        return voterGovPublicKeys.length;
    }

    /**
     * @dev Get a specific voter public key by index
     * @param _index The index of the public key in the array
     * @return publicKey The public key at the specified index
     */
    function getVoterGovPublicKey(uint256 _index)
        external
        view
        returns (string memory publicKey)
    {
        require(_index < voterGovPublicKeys.length, "Index out of bounds");
        return voterGovPublicKeys[_index];
    }

    /**
     * @dev Get the voting parameters
     * @return _votingId The voting ID
     * @return _candidateCount The number of candidates
     * @return _randomNumber The random number
     * @return _isSet Whether the voting parameters have been set
     */
    function getVotingParameters()
        external
        view
        returns (
            string memory _votingId,
            uint256 _candidateCount,
            uint256 _randomNumber,
            bool _isSet
        )
    {
        return (votingId, candidateList.length, randomNumber, votingParamsSet);
    }

    /**
     * @dev Get a candidate name by index
     * @param _index The index of the candidate in the array
     * @return candidate The candidate name at the specified index
     */
    function getCandidate(uint256 _index)
        external
        view
        returns (string memory candidate)
    {
        require(votingParamsSet, "Voting parameters have not been set");
        require(_index < candidateList.length, "Index out of bounds");
        return candidateList[_index];
    }

    /**
     * @dev Get all candidates
     * @return candidates The complete list of candidate names
     */
    function getAllCandidates()
        external
        view
        returns (string[] memory candidates)
    {
        require(votingParamsSet, "Voting parameters have not been set");

        string[] memory result = new string[](candidateList.length);
        for (uint256 i = 0; i < candidateList.length; i++) {
            result[i] = candidateList[i];
        }

        return result;
    }

    /**
     * @dev Get the voting ID
     * @return _votingId The unique identifier for this voting session
     */
    function getVotingId() external view returns (string memory _votingId) {
        require(votingParamsSet, "Voting parameters have not been set");
        return votingId;
    }

    /**
     * @dev Get the random number
     * @return _randomNumber The random number set for this voting session
     */
    function getRandomNumber() external view returns (uint256 _randomNumber) {
        require(votingParamsSet, "Voting parameters have not been set");
        return randomNumber;
    }

    /**
     * @dev Check if voting parameters have been set
     * @return _isSet Whether the voting parameters have been set
     */
    function isVotingParametersSet() external view returns (bool _isSet) {
        return votingParamsSet;
    }

    /**
     * @dev Get the public key of a registered voter by index.
     * @param _index The index of the voter in the array.
     * @return publicKey The public key at the specified index.
     */
    function getRegisteredVoterPublicKey(uint256 _index)
        external
        view
        returns (string memory publicKey)
    {
        require(_index < voterDataArray.length, "Index out of bounds");
        return voterDataArray[_index].publicKey;
    }


function incrementVoteCount(uint256 _index, string memory _candidate)
        external
        onlyOwner
    {
        require(_index < voterDataArray.length, "Index out of bounds");
        require(!voterDataArray[_index].isVoteCounted, "Vote already counted");
        candidateVotes[_candidate]++;
        voterDataArray[_index].isVoteCounted = true;
    }

    /**
     * @dev Get the winner candidate
     */
    function getWinner() external view returns (string memory winner) {
        uint256 maxVotes = 0;
        string memory winningCandidate = "";
        for (uint256 i = 0; i < candidateList.length; i++) {
            if (candidateVotes[candidateList[i]] > maxVotes) {
                maxVotes = candidateVotes[candidateList[i]];
                winningCandidate = candidateList[i];
            }
        }
        return winningCandidate;
    }


    /**
     * @dev Modify the current phase
     * @param _phase New phase value
     */
    function setPhase(uint256 _phase) external onlyOwner {
        require(_phase > currentPhase, "Phase can only progress forward");
        currentPhase = _phase;
    }

    /**
     * @dev Get the current phase
     * @return The current phase value
     */
    function getPhase() external view returns (uint256) {
        return currentPhase;
    }
}
