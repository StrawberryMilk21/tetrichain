/**
 * BlockchainInterface - Sui Blockchain Integration
 * 
 * This module handles all blockchain interactions including:
 * - Wallet connection (OneWallet)
 * - Game seed creation
 * - Score submission
 * - Leaderboard queries
 * - Token balance queries
 */

import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Transaction } from '@mysten/sui/transactions';
import { CONTRACT_CONFIG, RPC_URL, TX_CONFIG, NETWORK } from './config.js';

/**
 * Error codes from the smart contract
 * These match the error constants defined in the Move contract
 */
const CONTRACT_ERRORS = {
    EInvalidScore: 'Invalid score. Score must be between 0 and 999,999.',
    EInvalidSeed: 'Game seed not found or invalid. Please start a new game.',
    ESeedAlreadyUsed: 'This game seed has already been used. Please start a new game.',
    EScoreVerificationFailed: 'Score verification failed. The score does not match the game seed.',
    EUnauthorized: 'You are not authorized to use this game seed. It belongs to a different player.',
    EInsufficientGas: 'Insufficient SUI for transaction. Please add more SUI to your wallet.'
};

/**
 * Parse error message from blockchain transaction
 * Converts technical error messages into user-friendly text
 * 
 * Requirements: 8.1, 8.3, 8.4
 * 
 * @param {Error} error - The error object from the blockchain operation
 * @returns {string} User-friendly error message
 */
function parseBlockchainError(error) {
    if (!error) {
        return 'An unknown error occurred. Please try again.';
    }

    const errorMessage = error.message || error.toString();
    
    // Check for wallet connection errors (return as-is, already user-friendly)
    if (errorMessage.includes('Wallet not connected')) {
        return errorMessage;
    }
    
    // Check for network connection errors (return as-is, already user-friendly)
    if (errorMessage.includes('Network connection lost')) {
        return errorMessage;
    }
    
    // Check for validation errors (return as-is, already user-friendly)
    if (errorMessage.includes('Invalid score') || 
        errorMessage.includes('Invalid game seed')) {
        return errorMessage;
    }
    
    // Check for contract-specific error codes
    for (const [code, message] of Object.entries(CONTRACT_ERRORS)) {
        if (errorMessage.includes(code)) {
            return message;
        }
    }
    
    // Check for insufficient gas errors
    if (errorMessage.toLowerCase().includes('insufficient') && 
        (errorMessage.toLowerCase().includes('gas') || errorMessage.toLowerCase().includes('balance'))) {
        return 'Insufficient SUI for transaction. You need approximately 0.02 SUI for gas fees. Please add SUI to your wallet and try again.';
    }
    
    // Check for network/RPC errors
    if (errorMessage.toLowerCase().includes('network') || 
        errorMessage.toLowerCase().includes('fetch') ||
        errorMessage.toLowerCase().includes('timeout')) {
        return 'Network error. Please check your internet connection and try again.';
    }
    
    // Check for wallet rejection
    if (errorMessage.toLowerCase().includes('reject') || 
        errorMessage.toLowerCase().includes('denied') ||
        errorMessage.toLowerCase().includes('cancel')) {
        return 'Transaction was rejected. Please approve the transaction in your wallet to continue.';
    }
    
    // Check for object not found errors
    if (errorMessage.toLowerCase().includes('not found') || 
        errorMessage.toLowerCase().includes('does not exist')) {
        return 'Blockchain object not found. This may be a configuration issue. Please refresh the page and try again.';
    }
    
    // Check for invalid transaction errors
    if (errorMessage.toLowerCase().includes('invalid transaction') || 
        errorMessage.toLowerCase().includes('transaction failed')) {
        return 'Transaction failed. Please check your inputs and try again.';
    }
    
    // Return a generic but helpful error message
    return `Transaction error: ${errorMessage.substring(0, 100)}${errorMessage.length > 100 ? '...' : ''}`;
}

/**
 * Estimate gas cost for a transaction
 * Provides helpful guidance on gas requirements
 * 
 * Requirements: 8.3
 * 
 * @param {string} operationType - Type of operation (e.g., 'createSeed', 'submitScore')
 * @returns {string} Estimated gas cost message
 */
function getGasEstimate(operationType) {
    const estimates = {
        createSeed: '0.01 SUI',
        submitScore: '0.02 SUI',
        query: '0 SUI (read-only)'
    };
    
    return estimates[operationType] || '0.01-0.02 SUI';
}

/**
 * BlockchainInterface class - Manages all blockchain interactions
 */
export class BlockchainInterface {
    constructor() {
        this.wallet = null;
        this.playerAddress = null;
        this.isConnected = false;
        this.suiClient = new SuiClient({ url: RPC_URL });
        this.isOnline = true; // Track network connectivity
        this.networkCheckInterval = null;
        
        // Set up network monitoring
        this.setupNetworkMonitoring();
    }
    
    /**
     * Set up network connectivity monitoring
     * Requirements: 8.2, 8.5
     */
    setupNetworkMonitoring() {
        // Check if we're in a browser environment
        if (typeof window !== 'undefined') {
            // Listen for online/offline events
            window.addEventListener('online', () => {
                console.log('Network connection restored');
                this.isOnline = true;
            });
            
            window.addEventListener('offline', () => {
                console.log('Network connection lost');
                this.isOnline = false;
            });
            
            // Set initial online status
            this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        }
    }
    
    /**
     * Check if network is available
     * Requirements: 8.2
     * 
     * @returns {boolean} True if network is available
     */
    isNetworkAvailable() {
        return this.isOnline;
    }
    
    /**
     * Check network connectivity by attempting to reach the RPC endpoint
     * Requirements: 8.2
     * 
     * @returns {Promise<boolean>} True if network is reachable
     */
    async checkNetworkConnectivity() {
        try {
            // Try to fetch chain identifier (lightweight query)
            const response = await Promise.race([
                this.suiClient.getChainIdentifier(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Network timeout')), 5000)
                )
            ]);
            
            this.isOnline = true;
            return true;
        } catch (error) {
            console.warn('Network connectivity check failed:', error);
            this.isOnline = false;
            return false;
        }
    }

    /**
     * Check if a Sui wallet is installed in the browser
     * @returns {boolean} True if a Sui wallet is detected
     */
    isWalletInstalled() {
        if (typeof window === 'undefined') return false;
        
        // Check for OneChain wallet (most common)
        if (window.onechainWallet || window.onechain) return true;
        
        // Check for Sui Wallet Standard API
        if (window.suiWallets && window.suiWallets.length > 0) return true;
        
        // Check for legacy wallet objects
        return !!(window.suiWallet || window.oneWallet || window.sui);
    }

    /**
     * Connect to Sui Wallet (OneChain, OneWallet or Sui Wallet)
     * Requirements: 8.1, 8.4
     * 
     * @returns {Promise<{success: boolean, address?: string, error?: string}>}
     */
    async connectWallet() {
        try {
            console.log('Attempting wallet connection...');
            console.log('Available wallet objects:', {
                onechainWallet: typeof window.onechainWallet,
                onechain: typeof window.onechain,
                suiWallets: typeof window.suiWallets,
                suiWallet: typeof window.suiWallet,
                oneWallet: typeof window.oneWallet,
                sui: typeof window.sui
            });

            let wallet = null;
            let accounts = null;

            // Try OneChain wallet (most common)
            // OneChain is multi-chain, we need to use the Sui-specific interface
            if (window.onechain && window.onechain.sui) {
                console.log('OneChain wallet detected - using Sui interface');
                wallet = window.onechain.sui;
                
                console.log('Sui wallet object:', wallet);
                console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(wallet)));
                console.log('Available properties:', Object.keys(wallet));
                
                // Request permissions for Sui
                if (typeof wallet.requestPermissions === 'function') {
                    console.log('Requesting Sui permissions');
                    try {
                        const permissions = await wallet.requestPermissions({
                            permissions: ['viewAccount', 'suggestTransactions']
                        });
                        console.log('Permissions granted:', permissions);
                    } catch (error) {
                        console.warn('Permission request failed:', error);
                    }
                }
                
                // Connect
                if (typeof wallet.connect === 'function') {
                    console.log('Connecting to Sui via OneChain');
                    const connectResult = await wallet.connect();
                    console.log('Connect result:', connectResult);
                }
                
                // Get accounts
                if (typeof wallet.getAccounts === 'function') {
                    console.log('Getting Sui accounts');
                    accounts = await wallet.getAccounts();
                    console.log('Sui accounts:', accounts);
                } else if (typeof wallet.requestAccounts === 'function') {
                    console.log('Requesting Sui accounts');
                    accounts = await wallet.requestAccounts();
                    console.log('Sui accounts:', accounts);
                }
            }
            // Fallback to onechainWallet if sui interface not available
            else if (window.onechainWallet) {
                console.log('OneChain wallet detected - using generic interface');
                wallet = window.onechainWallet;
                
                console.log('Wallet object:', wallet);
                
                // Try connect method
                if (typeof wallet.connect === 'function') {
                    console.log('Trying connect method');
                    const connectResult = await wallet.connect();
                    console.log('Connect result:', connectResult);
                }
                
                // Then get accounts
                if (typeof wallet.getAccounts === 'function') {
                    console.log('Trying getAccounts method');
                    accounts = await wallet.getAccounts();
                    console.log('getAccounts result:', accounts);
                }
            }
            // Try Sui Wallet Standard API (modern approach)
            else if (window.suiWallets && window.suiWallets.length > 0) {
                console.log('Using Sui Wallet Standard API');
                console.log('Available wallets:', window.suiWallets);
                
                // Get the first available wallet
                wallet = window.suiWallets[0];
                
                // Request connection
                const result = await wallet.connect();
                accounts = result.accounts;
                
                console.log('Connected via Wallet Standard:', accounts);
            }
            // Try legacy OneWallet API
            else if (window.oneWallet) {
                console.log('Using OneWallet legacy API');
                wallet = window.oneWallet;
                accounts = await wallet.requestAccounts();
            }
            // Try legacy Sui Wallet API
            else if (window.suiWallet) {
                console.log('Using Sui Wallet legacy API');
                wallet = window.suiWallet;
                const permissions = await wallet.requestPermissions();
                accounts = permissions.map(p => p.address);
            }
            // Try generic sui object
            else if (window.sui) {
                console.log('Using generic Sui wallet API');
                wallet = window.sui;
                
                if (typeof wallet.requestAccounts === 'function') {
                    accounts = await wallet.requestAccounts();
                } else if (typeof wallet.connect === 'function') {
                    const result = await wallet.connect();
                    accounts = [result.address];
                }
            }
            else {
                throw new Error('No Sui wallet detected. Please install OneChain, OneWallet or Sui Wallet browser extension.');
            }

            if (!wallet) {
                throw new Error('Could not access wallet. Please make sure your wallet extension is enabled.');
            }
            
            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found. Please create an account in your wallet first.');
            }

            // Store wallet and address
            this.wallet = wallet;
            
            // Extract address (handle different formats)
            if (typeof accounts[0] === 'string') {
                this.playerAddress = accounts[0];
            } else if (accounts[0].address) {
                this.playerAddress = accounts[0].address;
            } else {
                throw new Error('Could not extract wallet address from account data');
            }
            
            this.isConnected = true;

            console.log('Wallet connected successfully:', this.playerAddress);

            // Check if wallet is on the correct network
            try {
                if (typeof this.wallet.getChain === 'function') {
                    const chain = await this.wallet.getChain();
                    console.log('Current wallet network:', chain);
                    
                    // Check if we're on testnet
                    if (NETWORK === 'testnet' && chain && !chain.toLowerCase().includes('test')) {
                        console.warn('⚠️ Wallet may be on wrong network. Expected testnet but got:', chain);
                        console.warn('Please switch your wallet to Sui Testnet in wallet settings');
                    }
                }
            } catch (error) {
                console.warn('Could not verify wallet network:', error);
            }

            return {
                success: true,
                address: this.playerAddress
            };
        } catch (error) {
            console.error('Wallet connection error:', error);
            
            // Reset state on error
            this.wallet = null;
            this.playerAddress = null;
            this.isConnected = false;

            // Parse error for user-friendly message
            let errorMessage = error.message || 'Failed to connect wallet';
            
            // Check for user rejection
            if (errorMessage.toLowerCase().includes('reject') || 
                errorMessage.toLowerCase().includes('denied')) {
                errorMessage = 'Wallet connection was rejected. Please approve the connection request in your wallet to continue.';
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * Disconnect wallet
     * @returns {Promise<{success: boolean}>}
     */
    async disconnectWallet() {
        try {
            // Reset internal state
            this.wallet = null;
            this.playerAddress = null;
            this.isConnected = false;

            console.log('Wallet disconnected');

            return {
                success: true
            };
        } catch (error) {
            console.error('Wallet disconnection error:', error);
            
            return {
                success: false,
                error: error.message || 'Failed to disconnect wallet'
            };
        }
    }

    /**
     * Get the current player address
     * @returns {string|null} The player's Sui address or null if not connected
     */
    getPlayerAddress() {
        return this.playerAddress;
    }

    /**
     * Check if wallet is currently connected
     * @returns {boolean} True if wallet is connected
     */
    isWalletConnected() {
        return this.isConnected && this.playerAddress !== null;
    }

    /**
     * Create a new game seed on the blockchain for provably fair gameplay
     * 
     * Requirements: 5.1, 5.2, 8.1, 8.2, 8.3, 8.4, 8.5
     * - Builds transaction to call contract's create_game_seed()
     * - Signs and executes transaction via OneWallet
     * - Parses response to extract seed bytes
     * - Returns seed to game
     * 
     * @returns {Promise<{success: boolean, seed?: Uint8Array, txDigest?: string, error?: string, gasEstimate?: string}>}
     */
    async createGameSeed() {
        try {
            // Check if wallet is connected
            if (!this.isWalletConnected()) {
                throw new Error('Wallet not connected. Please connect your wallet first.');
            }
            
            // Check network connectivity
            if (!this.isNetworkAvailable()) {
                throw new Error('Network connection lost. Please check your internet connection and try again.');
            }

            console.log('Creating game seed on blockchain...');
            console.log('Estimated gas cost:', getGasEstimate('createSeed'));

            // Build the transaction using the appropriate class based on wallet
            let tx;
            const isOneChain = window.onechain && window.onechain.sui && this.wallet === window.onechain.sui;
            
            if (isOneChain) {
                // OneChain requires the new Transaction class
                console.log('Building transaction with new Transaction class for OneChain');
                tx = new Transaction();
            } else {
                // Other wallets use TransactionBlock
                tx = new TransactionBlock();
            }
            
            // Set the sender address
            tx.setSender(this.playerAddress);
            
            // Call the create_game_seed function
            // Parameters: random (0x8), clock (0x6)
            tx.moveCall({
                target: `${CONTRACT_CONFIG.packageId}::${CONTRACT_CONFIG.moduleName}::create_game_seed`,
                arguments: [
                    tx.object(CONTRACT_CONFIG.randomId),  // Random object
                    tx.object(CONTRACT_CONFIG.clockId),   // Clock object
                ],
            });

            // Set gas budget
            tx.setGasBudget(TX_CONFIG.createSeedGasBudget);

            console.log('Transaction built, requesting signature from wallet...');

            // Sign and execute transaction via wallet
            let result;
            
            // Check if this is OneChain Sui wallet
            if (isOneChain) {
                console.log('Using OneChain Sui wallet');
                
                // OneChain might need us to use signTransactionBlock then execute separately
                // Or it might have its own client
                console.log('Checking wallet capabilities:', {
                    hasSignTransactionBlock: typeof this.wallet.signTransactionBlock,
                    hasSignAndExecuteTransactionBlock: typeof this.wallet.signAndExecuteTransactionBlock,
                    hasExecuteTransactionBlock: typeof this.wallet.executeTransactionBlock
                });
                
                // Try using signTransactionBlock then execute via SuiClient
                if (typeof this.wallet.signTransactionBlock === 'function') {
                    console.log('Using signTransactionBlock + SuiClient.executeTransactionBlock');
                    
                    try {
                        console.log('About to sign transaction:', {
                            txType: tx.constructor.name,
                            hasToJSON: typeof tx.toJSON,
                            txObject: tx
                        });
                        
                        const signedTx = await this.wallet.signTransactionBlock({
                            transactionBlock: tx,
                            account: this.playerAddress,
                            chain: 'sui:testnet',
                        });
                        console.log('Transaction signed successfully:', signedTx);
                        
                        // Execute via SuiClient
                        result = await this.suiClient.executeTransactionBlock({
                            transactionBlock: signedTx.transactionBlockBytes,
                            signature: signedTx.signature,
                            options: {
                                showEffects: true,
                                showObjectChanges: true,
                            },
                        });
                        console.log('Transaction executed via SuiClient:', result);
                    } catch (error) {
                        console.error('Sign and execute failed:', error);
                        throw error;
                    }
                } else {
                    throw new Error('OneChain wallet does not support signTransactionBlock');
                }
            } else if (typeof this.wallet.signAndExecuteTransactionBlock === 'function') {
                // Sui Wallet Standard API
                result = await this.wallet.signAndExecuteTransactionBlock({
                    transactionBlock: tx,
                    options: {
                        showEffects: true,
                        showObjectChanges: true,
                    },
                });
            } else if (typeof this.wallet.signAndExecuteTransaction === 'function') {
                // Legacy OneWallet API
                result = await this.wallet.signAndExecuteTransaction({
                    transaction: tx,
                    options: {
                        showEffects: true,
                        showObjectChanges: true,
                    },
                });
            } else {
                throw new Error('Wallet does not support transaction signing');
            }

            console.log('Transaction executed:', result);

            // Check if transaction was successful
            if (result.effects?.status?.status !== 'success') {
                const errorMsg = result.effects?.status?.error || 'Unknown error';
                throw new Error(`Transaction failed: ${errorMsg}`);
            }

            // Extract the created GameSeed object from object changes
            const createdObjects = result.objectChanges?.filter(
                change => change.type === 'created' && change.objectType.includes('::game::GameSeed')
            );

            if (!createdObjects || createdObjects.length === 0) {
                throw new Error('GameSeed object not found in transaction result. The contract may not have created the seed properly.');
            }

            const gameSeedObjectId = createdObjects[0].objectId;
            console.log('GameSeed object created:', gameSeedObjectId);

            // Fetch the GameSeed object to get the seed bytes
            const gameSeedObject = await this.suiClient.getObject({
                id: gameSeedObjectId,
                options: {
                    showContent: true,
                },
            });

            console.log('GameSeed object fetched:', gameSeedObject);

            // Extract seed bytes from the object content
            if (!gameSeedObject.data?.content?.fields) {
                throw new Error('Failed to read GameSeed object content. The blockchain may be experiencing issues.');
            }

            const seedBytes = gameSeedObject.data.content.fields.seed;
            
            if (!seedBytes || !Array.isArray(seedBytes)) {
                throw new Error('Invalid seed data in GameSeed object. Please try creating a new game.');
            }

            // Convert seed bytes array to Uint8Array
            const seed = new Uint8Array(seedBytes);

            console.log('Game seed created successfully:', seed);

            return {
                success: true,
                seed: seed,
                txDigest: result.digest,
                gameSeedObjectId: gameSeedObjectId
            };

        } catch (error) {
            console.error('Error creating game seed:', error);
            
            // Parse error for user-friendly message
            const errorMessage = parseBlockchainError(error);
            
            return {
                success: false,
                error: errorMessage,
                gasEstimate: getGasEstimate('createSeed')
            };
        }
    }

    /**
     * Submit a score to the blockchain leaderboard and claim token rewards
     * 
     * Requirements: 3.1, 3.2, 4.3, 8.1, 8.2, 8.3, 8.4, 8.5
     * - Builds transaction to call contract's submit_score()
     * - Includes game seed reference and final score
     * - Signs and executes transaction via OneWallet
     * - Parses transaction result
     * 
     * @param {string} gameSeedObjectId - The object ID of the GameSeed created for this game
     * @param {number} score - The final score from the game (0-999,999)
     * @returns {Promise<{success: boolean, tokensEarned?: number, txDigest?: string, error?: string, gasEstimate?: string}>}
     */
    async submitScore(gameSeedObjectId, score) {
        try {
            // Check if wallet is connected
            if (!this.isWalletConnected()) {
                throw new Error('Wallet not connected. Please connect your wallet first.');
            }
            
            // Check network connectivity
            if (!this.isNetworkAvailable()) {
                throw new Error('Network connection lost. Please check your internet connection and try again.');
            }

            // Validate game seed object ID
            if (!gameSeedObjectId || typeof gameSeedObjectId !== 'string') {
                throw new Error('Invalid game seed. Please start a new game with your wallet connected.');
            }

            // Validate score range
            if (typeof score !== 'number' || score < 0 || score > 999999) {
                throw new Error('Invalid score. Score must be a number between 0 and 999,999.');
            }

            console.log('Submitting score to blockchain...', { gameSeedObjectId, score });
            console.log('Estimated gas cost:', getGasEstimate('submitScore'));

            // Build the transaction using the appropriate class based on wallet
            let tx;
            const isOneChain = window.onechain && window.onechain.sui && this.wallet === window.onechain.sui;
            
            if (isOneChain) {
                // OneChain requires the new Transaction class
                console.log('Building transaction with new Transaction class for OneChain');
                tx = new Transaction();
            } else {
                // Other wallets use TransactionBlock
                tx = new TransactionBlock();
            }
            
            // Set the sender address
            tx.setSender(this.playerAddress);
            
            // Call the submit_score function
            // Parameters: game_seed, score, leaderboard, treasury, clock
            tx.moveCall({
                target: `${CONTRACT_CONFIG.packageId}::${CONTRACT_CONFIG.moduleName}::submit_score`,
                arguments: [
                    tx.object(gameSeedObjectId),              // game_seed: &mut GameSeed
                    tx.pure(score, 'u64'),                    // score: u64
                    tx.object(CONTRACT_CONFIG.leaderboardId), // leaderboard: &mut Leaderboard
                    tx.object(CONTRACT_CONFIG.treasuryId),    // treasury: &mut TokenTreasury
                    tx.object(CONTRACT_CONFIG.clockId),       // clock: &Clock
                ],
            });

            // Set gas budget
            tx.setGasBudget(TX_CONFIG.submitScoreGasBudget);

            console.log('Transaction built, requesting signature from wallet...');

            // Sign and execute transaction via wallet
            let result;
            
            // Check if this is OneChain Sui wallet
            if (isOneChain) {
                console.log('Using OneChain Sui wallet with Transaction class');
                result = await this.wallet.signAndExecuteTransactionBlock({
                    transactionBlock: tx,
                    account: this.playerAddress,
                    chain: 'sui:testnet',
                    options: {
                        showEffects: true,
                        showEvents: true,
                        showObjectChanges: true,
                    },
                });
            } else if (typeof this.wallet.signAndExecuteTransactionBlock === 'function') {
                // Sui Wallet Standard API
                result = await this.wallet.signAndExecuteTransactionBlock({
                    transactionBlock: tx,
                    options: {
                        showEffects: true,
                        showEvents: true,
                        showObjectChanges: true,
                    },
                });
            } else if (typeof this.wallet.signAndExecuteTransaction === 'function') {
                // Legacy OneWallet API
                result = await this.wallet.signAndExecuteTransaction({
                    transaction: tx,
                    options: {
                        showEffects: true,
                        showEvents: true,
                        showObjectChanges: true,
                    },
                });
            } else {
                throw new Error('Wallet does not support transaction signing');
            }

            console.log('Transaction executed:', result);

            // Check if transaction was successful
            if (result.effects?.status?.status !== 'success') {
                const errorMsg = result.effects?.status?.error || 'Unknown error';
                throw new Error(`Transaction failed: ${errorMsg}`);
            }

            // Calculate tokens earned (score / 100)
            const tokensEarned = Math.floor(score / 100);

            // Look for TokenMintEvent in the events
            let eventFound = false;
            if (result.events && result.events.length > 0) {
                for (const event of result.events) {
                    if (event.type.includes('::game::TokenMintEvent')) {
                        console.log('Token mint event found:', event);
                        eventFound = true;
                        break;
                    }
                }
            }

            console.log('Score submitted successfully!', {
                tokensEarned,
                txDigest: result.digest,
                eventFound
            });

            return {
                success: true,
                tokensEarned: tokensEarned,
                txDigest: result.digest
            };

        } catch (error) {
            console.error('Error submitting score:', error);
            
            // Parse error for user-friendly message
            const errorMessage = parseBlockchainError(error);
            
            return {
                success: false,
                error: errorMessage,
                gasEstimate: getGasEstimate('submitScore')
            };
        }
    }

    /**
     * Get the leaderboard from the blockchain
     * 
     * Requirements: 3.3, 3.5, 8.1, 8.2, 8.4, 8.5
     * - Queries contract's get_leaderboard() function
     * - Parses returned score entries
     * - Formats data for display
     * 
     * @returns {Promise<{success: boolean, scores?: Array, error?: string}>}
     */
    async getLeaderboard() {
        try {
            // Check network connectivity
            if (!this.isNetworkAvailable()) {
                throw new Error('Network connection lost. Please check your internet connection and try again.');
            }
            
            console.log('Fetching leaderboard from blockchain...');

            // Validate configuration
            if (!CONTRACT_CONFIG.leaderboardId) {
                throw new Error('Leaderboard configuration is missing. Please check the contract configuration.');
            }

            // Fetch the leaderboard object
            const leaderboardObject = await this.suiClient.getObject({
                id: CONTRACT_CONFIG.leaderboardId,
                options: {
                    showContent: true,
                },
            });

            console.log('Leaderboard object fetched:', leaderboardObject);

            // Check if object exists
            if (!leaderboardObject.data) {
                throw new Error('Leaderboard not found on blockchain. The contract may not be properly deployed.');
            }

            // Extract leaderboard data from the object content
            if (!leaderboardObject.data?.content?.fields) {
                throw new Error('Failed to read Leaderboard object content. The blockchain may be experiencing issues.');
            }

            const fields = leaderboardObject.data.content.fields;
            const topScores = fields.top_scores || [];

            console.log('Top scores:', topScores);

            // Parse score entries
            const scores = topScores.map(entry => ({
                player: entry.player,
                score: parseInt(entry.score),
                timestamp: parseInt(entry.timestamp),
                gameSeedId: entry.game_seed_id
            }));

            console.log('Leaderboard fetched successfully:', scores);

            return {
                success: true,
                scores: scores
            };

        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            
            // Parse error for user-friendly message
            const errorMessage = parseBlockchainError(error);
            
            return {
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * Get the player's token balance from the blockchain
     * 
     * Requirements: 4.4, 8.1, 8.2, 8.4, 8.5
     * - Queries player's token balance from blockchain
     * - Formats balance for display
     * 
     * @returns {Promise<{success: boolean, balance?: number, error?: string}>}
     */
    async getPlayerBalance() {
        try {
            // Check if wallet is connected
            if (!this.isWalletConnected()) {
                throw new Error('Wallet not connected. Please connect your wallet first.');
            }
            
            // Check network connectivity
            if (!this.isNetworkAvailable()) {
                throw new Error('Network connection lost. Please check your internet connection and try again.');
            }

            console.log('Fetching player token balance from blockchain...');

            // Validate configuration
            if (!CONTRACT_CONFIG.token || !CONTRACT_CONFIG.token.type) {
                throw new Error('Token configuration is missing. Please check the contract configuration.');
            }

            // Get all coins of type GAME owned by the player
            const coinType = CONTRACT_CONFIG.token.type;
            
            const coins = await this.suiClient.getCoins({
                owner: this.playerAddress,
                coinType: coinType,
            });

            console.log('Player coins fetched:', coins);

            // Sum up all coin balances
            let totalBalance = 0;
            if (coins.data && coins.data.length > 0) {
                for (const coin of coins.data) {
                    const balance = parseInt(coin.balance);
                    if (!isNaN(balance)) {
                        totalBalance += balance;
                    }
                }
            }

            // Convert from smallest unit to display unit (divide by 10^decimals)
            const decimals = CONTRACT_CONFIG.token.decimals || 9;
            const displayBalance = totalBalance / Math.pow(10, decimals);

            console.log('Player token balance:', {
                totalBalance,
                displayBalance,
                decimals
            });

            return {
                success: true,
                balance: displayBalance
            };

        } catch (error) {
            console.error('Error fetching player balance:', error);
            
            // Parse error for user-friendly message
            const errorMessage = parseBlockchainError(error);
            
            return {
                success: false,
                error: errorMessage
            };
        }
    }
}
