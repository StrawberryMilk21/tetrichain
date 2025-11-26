import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useState, useCallback, useEffect } from 'react';
import { CONTRACT_CONFIG, TX_CONFIG } from '../config.js';

/**
 * Custom hook for blockchain interactions
 * Handles game seed creation, score submission, and leaderboard queries
 */
export const useBlockchain = () => {
    const account = useCurrentAccount();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const client = useSuiClient();
    
    const [isCreatingGameSeed, setIsCreatingGameSeed] = useState(false);
    const [isSubmittingScore, setIsSubmittingScore] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);
    const [playerBalance, setPlayerBalance] = useState(0);
    const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);
    
    // Username state
    const [username, setUsername] = useState(null);
    const [isLoadingUsername, setIsLoadingUsername] = useState(true);
    const [isRegisteringUsername, setIsRegisteringUsername] = useState(false);

    // Load username from localStorage on mount
    useEffect(() => {
        if (account) {
            const storageKey = `tetrichain_username_${account.address}`;
            const storedUsername = localStorage.getItem(storageKey);
            console.log('🔍 Loading username for address:', account.address);
            console.log('📦 Storage key:', storageKey);
            console.log('👤 Stored username:', storedUsername || 'NOT FOUND');
            if (storedUsername) {
                setUsername(storedUsername);
                console.log('✅ Username loaded successfully:', storedUsername);
            } else {
                console.log('❌ No username found in storage');
            }
            setIsLoadingUsername(false);
        } else {
            setUsername(null);
            setIsLoadingUsername(false);
        }
    }, [account]);

    /**
     * Create a new game seed on the blockchain
     */
    const createGameSeed = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (!account) {
                reject(new Error('Wallet not connected'));
                return;
            }

            setIsCreatingGameSeed(true);

            const tx = new Transaction();
            tx.setSender(account.address);
            
            tx.moveCall({
                target: `${CONTRACT_CONFIG.packageId}::${CONTRACT_CONFIG.moduleName}::create_game_seed`,
                arguments: [
                    tx.object(CONTRACT_CONFIG.randomId),
                    tx.object(CONTRACT_CONFIG.clockId),
                ],
            });

            tx.setGasBudget(TX_CONFIG.createSeedGasBudget);

            signAndExecuteTransaction(
                { 
                    transaction: tx,
                },
                {
                    onSuccess: async (result) => {
                        try {
                            console.log('Transaction result:', result);
                            console.log('Transaction digest:', result.digest);
                            
                            // Wait a moment for the transaction to be indexed
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            
                            // Get the transaction details with object changes
                            const txDetails = await client.getTransactionBlock({
                                digest: result.digest,
                                options: {
                                    showEffects: true,
                                    showObjectChanges: true,
                                }
                            });
                            
                            console.log('Transaction details:', txDetails);
                            
                            // Extract the created GameSeed object
                            const createdObjects = txDetails.objectChanges?.filter(
                                change => change.type === 'created' && change.objectType.includes('::game::GameSeed')
                            );

                            if (!createdObjects || createdObjects.length === 0) {
                                console.error('No GameSeed object found. Transaction details:', txDetails);
                                throw new Error('GameSeed object not found in transaction result');
                            }

                            const gameSeedObjectId = createdObjects[0].objectId;
                            console.log('GameSeed object ID:', gameSeedObjectId);

                            // Fetch the GameSeed object to get the seed bytes
                            const gameSeedObject = await client.getObject({
                                id: gameSeedObjectId,
                                options: { showContent: true },
                            });

                            console.log('GameSeed object:', gameSeedObject);

                            const seedBytes = gameSeedObject.data?.content?.fields?.seed;
                            
                            if (!seedBytes || !Array.isArray(seedBytes)) {
                                console.error('Invalid seed data:', seedBytes);
                                throw new Error('Invalid seed data in GameSeed object');
                            }

                            const seed = new Uint8Array(seedBytes);
                            console.log('Seed extracted:', seed);

                            setIsCreatingGameSeed(false);
                            resolve({ 
                                success: true, 
                                seed, 
                                gameSeedObjectId, 
                                txDigest: result.digest 
                            });
                        } catch (error) {
                            console.error('Error processing transaction result:', error);
                            setIsCreatingGameSeed(false);
                            reject(error);
                        }
                    },
                    onError: (error) => {
                        console.error('Transaction error:', error);
                        setIsCreatingGameSeed(false);
                        reject(error);
                    },
                }
            );
        });
    }, [account, signAndExecuteTransaction, client]);

    /**
     * Submit score to blockchain
     */
    const submitScore = useCallback((gameSeedObjectId, score) => {
        return new Promise((resolve, reject) => {
            if (!account) {
                reject(new Error('Wallet not connected'));
                return;
            }

            if (!gameSeedObjectId || typeof gameSeedObjectId !== 'string') {
                reject(new Error('Invalid game seed'));
                return;
            }

            if (typeof score !== 'number' || score < 0 || score > 999999) {
                reject(new Error('Invalid score'));
                return;
            }

            setIsSubmittingScore(true);

            const tx = new Transaction();
            tx.setSender(account.address);
            
            tx.moveCall({
                target: `${CONTRACT_CONFIG.packageId}::${CONTRACT_CONFIG.moduleName}::submit_score`,
                arguments: [
                    tx.object(gameSeedObjectId),
                    tx.pure.u64(score),
                    tx.object(CONTRACT_CONFIG.leaderboardId),
                    tx.object(CONTRACT_CONFIG.treasuryId),
                    tx.object(CONTRACT_CONFIG.clockId),
                ],
            });

            tx.setGasBudget(TX_CONFIG.submitScoreGasBudget);

            signAndExecuteTransaction(
                { 
                    transaction: tx,
                    options: {
                        showEffects: true,
                        showObjectChanges: true,
                        showEvents: true,
                    }
                },
                {
                    onSuccess: (result) => {
                        console.log('Score submission result:', result);
                        const tokensEarned = Math.floor(score / 100);
                        setIsSubmittingScore(false);
                        resolve({ 
                            success: true, 
                            tokensEarned, 
                            txDigest: result.digest 
                        });
                    },
                    onError: (error) => {
                        setIsSubmittingScore(false);
                        reject(error);
                    },
                }
            );
        });
    }, [account, signAndExecuteTransaction]);

    /**
     * Fetch leaderboard from blockchain
     */
    const fetchLeaderboard = useCallback(async () => {
        try {
            setIsLoadingLeaderboard(true);

            const leaderboardObject = await client.getObject({
                id: CONTRACT_CONFIG.leaderboardId,
                options: { showContent: true },
            });

            const fields = leaderboardObject.data?.content?.fields;
            console.log('Leaderboard fields:', fields);
            const topScores = fields?.top_scores || [];
            console.log('Top scores raw:', topScores);

            const scores = topScores.map(entry => {
                console.log('Processing entry:', entry);
                return {
                    player: entry.player || entry.fields?.player || 'unknown',
                    score: parseInt(entry.score || entry.fields?.score || 0),
                    timestamp: parseInt(entry.timestamp || entry.fields?.timestamp || 0),
                    gameSeedId: entry.game_seed_id || entry.fields?.game_seed_id || ''
                };
            });

            console.log('Processed scores:', scores);
            setLeaderboard(scores);
            setIsLoadingLeaderboard(false);
            return scores;
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            setIsLoadingLeaderboard(false);
            throw error;
        }
    }, [client]);

    /**
     * Fetch player token balance
     */
    const fetchPlayerBalance = useCallback(async () => {
        if (!account) {
            console.log('No account connected');
            return;
        }

        try {
            setIsLoadingBalance(true);

            const coinType = CONTRACT_CONFIG.token.type;
            console.log('Fetching balance for address:', account.address);
            console.log('Coin type:', coinType);
            
            const coins = await client.getCoins({
                owner: account.address,
                coinType: coinType,
            });

            console.log('Coins response:', coins);
            console.log('Number of coins found:', coins.data?.length || 0);

            let totalBalance = 0;
            if (coins.data && coins.data.length > 0) {
                for (const coin of coins.data) {
                    console.log('Coin:', coin);
                    const balance = parseInt(coin.balance);
                    if (!isNaN(balance)) {
                        totalBalance += balance;
                        console.log('Added balance:', balance, 'Total now:', totalBalance);
                    }
                }
            }

            // HARDCODED: Token has 0 decimals, raw balance = display balance
            const decimals = 0;
            const displayBalance = totalBalance / Math.pow(10, decimals);

            console.log('Total balance (raw):', totalBalance);
            console.log('Decimals:', decimals);
            console.log('Display balance:', displayBalance);

            setPlayerBalance(displayBalance);
            setIsLoadingBalance(false);
            return displayBalance;
        } catch (error) {
            console.error('Error fetching player balance:', error);
            setIsLoadingBalance(false);
            throw error;
        }
    }, [account, client]);

    // Auto-fetch leaderboard on mount
    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    // Auto-fetch balance when account changes
    useEffect(() => {
        if (account) {
            fetchPlayerBalance();
        }
    }, [account, fetchPlayerBalance]);

    /**
     * Fetch username for the connected wallet
     */
    const fetchUsername = useCallback(async () => {
        if (!account) {
            setUsername(null);
            return null;
        }

        try {
            setIsLoadingUsername(true);

            // Query the username registry
            const registryObject = await client.getObject({
                id: CONTRACT_CONFIG.usernameRegistryId,
                options: { showContent: true },
            });

            const fields = registryObject.data?.content?.fields;
            const usernamesTable = fields?.usernames;

            if (!usernamesTable) {
                console.log('No usernames table found');
                setUsername(null);
                setIsLoadingUsername(false);
                return null;
            }

            // TODO: Query the table for the user's address
            // This is a placeholder - actual implementation depends on how the table is structured
            // For now, we'll return null and implement this when the smart contract is deployed
            
            console.log('Username lookup not yet implemented');
            setUsername(null);
            setIsLoadingUsername(false);
            return null;

        } catch (error) {
            console.error('Error fetching username:', error);
            setUsername(null);
            setIsLoadingUsername(false);
            return null;
        }
    }, [account, client]);

    /**
     * Register a username for the connected wallet
     * Saves to localStorage immediately, attempts blockchain registration
     */
    const registerUsername = useCallback((usernameToRegister) => {
        return new Promise((resolve, reject) => {
            if (!account) {
                reject(new Error('Wallet not connected'));
                return;
            }

            if (!usernameToRegister || usernameToRegister.length < 3 || usernameToRegister.length > 16) {
                reject(new Error('Username must be 3-16 characters'));
                return;
            }

            const alphanumericRegex = /^[a-zA-Z0-9]+$/;
            if (!alphanumericRegex.test(usernameToRegister)) {
                reject(new Error('Username must be alphanumeric only'));
                return;
            }

            setIsRegisteringUsername(true);

            // Save to localStorage immediately
            const storageKey = `tetrichain_username_${account.address}`;
            localStorage.setItem(storageKey, usernameToRegister);
            setUsername(usernameToRegister);
            console.log('💾 Username saved to localStorage:', usernameToRegister);
            console.log('🔑 Storage key:', storageKey);

            // Try to register on blockchain (will fail if module not deployed)
            const tx = new Transaction();
            tx.setSender(account.address);
            
            tx.moveCall({
                target: `${CONTRACT_CONFIG.packageId}::${CONTRACT_CONFIG.moduleName}::register_username`,
                arguments: [
                    tx.object(CONTRACT_CONFIG.usernameRegistryId),
                    tx.pure.string(usernameToRegister),
                ],
            });

            tx.setGasBudget(TX_CONFIG.submitScoreGasBudget);

            signAndExecuteTransaction(
                { 
                    transaction: tx,
                },
                {
                    onSuccess: async (result) => {
                        try {
                            console.log('Username registration successful on blockchain:', result);
                            setIsRegisteringUsername(false);
                            resolve({
                                success: true,
                                username: usernameToRegister,
                                digest: result.digest,
                                onChain: true,
                            });
                        } catch (error) {
                            console.error('Error after username registration:', error);
                            setIsRegisteringUsername(false);
                            // Still resolve since we saved locally
                            resolve({
                                success: true,
                                username: usernameToRegister,
                                onChain: false,
                            });
                        }
                    },
                    onError: (error) => {
                        console.warn('Blockchain registration failed (module not deployed?), using local storage:', error);
                        setIsRegisteringUsername(false);
                        // Still resolve since we saved locally
                        resolve({
                            success: true,
                            username: usernameToRegister,
                            onChain: false,
                        });
                    },
                }
            );
        });
    }, [account, signAndExecuteTransaction]);

    // Note: Username is loaded from localStorage in the effect above
    // No need to fetch from blockchain since module isn't deployed yet

    return {
        account,
        isCreatingGameSeed,
        isSubmittingScore,
        isLoadingLeaderboard,
        isLoadingBalance,
        leaderboard,
        playerBalance,
        createGameSeed,
        submitScore,
        fetchLeaderboard,
        fetchPlayerBalance,
        // Username functions
        username,
        isLoadingUsername,
        isRegisteringUsername,
        registerUsername,
        fetchUsername,
    };
};
