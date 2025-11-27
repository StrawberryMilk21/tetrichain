import { useState, useEffect } from 'react';
import { ConnectButton } from '@mysten/dapp-kit';
import GameBoard from './components/GameBoard.jsx';
import GameInfo from './components/GameInfo.jsx';
import PiecePreview from './components/PiecePreview.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import WalletStatus from './components/WalletStatus.jsx';
import LoadingOverlay from './components/LoadingOverlay.jsx';
import Toast from './components/Toast.jsx';
import UsernameRegistrationModal from './components/UsernameRegistrationModal.jsx';
import MultiplayerMenu from './components/MultiplayerMenu.jsx';
import BattleView from './components/BattleView.jsx';
import SkinUnlockNotification from './components/SkinUnlockNotification.jsx';
import CustomizationMenu from './components/CustomizationMenu.jsx';
import MarketplaceView from './components/MarketplaceView.jsx';
import { useGame } from './hooks/useGame.js';
import { useBlockchain } from './hooks/useBlockchain.js';
import { useWebSocket } from './hooks/useWebSocket.js';
import { useBattleFlow } from './hooks/useBattleFlow.js';
import { useMultiplayerBattle } from './hooks/useMultiplayerBattle.js';
import { useSkinUnlocks } from './hooks/useSkinUnlocks.js';
import { useSound } from './hooks/useSound.js';
import "./App.css";

function App() {
    const [gameSeedObjectId, setGameSeedObjectId] = useState(null);
    const [gameSeed, setGameSeed] = useState(null);
    const [currentScreen, setCurrentScreen] = useState('landing'); // landing, username, menu, solo, multiplayer, config, marketplace, customization
    const [gameMode, setGameMode] = useState('menu'); // menu, playing, gameOver
    const [loadingMessage, setLoadingMessage] = useState('');
    const [toast, setToast] = useState({ show: false, type: 'success', message: '' });
    const [showTutorial, setShowTutorial] = useState(false);
    const [selectedSkin, setSelectedSkin] = useState(() => {
        return parseInt(localStorage.getItem('selectedSkin') || '0');
    });
    const [isClaimingSkin, setIsClaimingSkin] = useState(false);
    
    const game = useGame(gameSeed);
    const blockchain = useBlockchain();
    const sound = useSound();
    
    // Skin unlock system
    const skinUnlocks = useSkinUnlocks(game.gameState.score);
    
    // Multiplayer hooks
    const webSocket = useWebSocket(blockchain.account?.address, blockchain.username);
    const battleFlow = useBattleFlow(webSocket.socket, blockchain.account?.address, blockchain.username);
    const multiplayerBattle = useMultiplayerBattle(
        webSocket.socket,
        battleFlow.roomData,
        battleFlow.opponentData
    );
    
    // Handle wallet connection and username flow
    useEffect(() => {
        if (blockchain.account && currentScreen === 'landing') {
            // Wallet just connected, check if user has username
            if (!blockchain.isLoadingUsername) {
                if (!blockchain.username) {
                    // No username, show registration modal
                    setCurrentScreen('username');
                } else {
                    // Has username, go to menu
                    setCurrentScreen('menu');
                }
            }
        }
    }, [blockchain.account, blockchain.username, blockchain.isLoadingUsername, currentScreen]);

    // Handle successful username registration
    const handleUsernameRegistered = () => {
        showToast('success', 'Username registered successfully!');
        setCurrentScreen('menu');
    };

    // Show toast notification
    const showToast = (type, message) => {
        setToast({ show: true, type, message });
    };

    // Handle start game
    const handleStartGame = async () => {
        // Must have wallet connected
        if (!blockchain.account) {
            showToast('error', 'Please connect your wallet first!');
            return;
        }

        try {
            setLoadingMessage('Creating game seed on blockchain...');
            const result = await blockchain.createGameSeed();
            setGameSeedObjectId(result.gameSeedObjectId);
            setGameSeed(result.seed);
            showToast('success', 'Game seed created! Your game is provably fair.');
            
            game.startGame();
            setGameMode('playing');
        } catch (error) {
            console.error('Failed to start game:', error);
            showToast('error', error.message || 'Failed to create game seed. Please try again.');
        }
    };

    // Handle game over
    useEffect(() => {
        if (game.gameState.isGameOver && gameMode === 'playing') {
            setGameMode('gameOver');
        }
    }, [game.gameState.isGameOver, gameMode]);

    // Handle submit score
    const handleSubmitScore = async () => {
        if (!gameSeedObjectId || !blockchain.account) {
            showToast('error', 'No blockchain game seed. Connect wallet and start a new game.');
            return;
        }

        try {
            setLoadingMessage('Submitting score to blockchain...');
            const result = await blockchain.submitScore(gameSeedObjectId, game.gameState.score);
            showToast('success', `Score submitted! You earned ${result.tokensEarned} TETRI tokens!`);
            
            // Wait a bit for blockchain to process, then refresh data
            setLoadingMessage('Updating leaderboard and balance...');
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
            
            await blockchain.fetchLeaderboard();
            await blockchain.fetchPlayerBalance();
            
            setLoadingMessage('');
        } catch (error) {
            console.error('Failed to submit score:', error);
            showToast('error', error.message || 'Failed to submit score to blockchain.');
            setLoadingMessage('');
        }
    };

    // Handle play again
    const handlePlayAgain = () => {
        setGameMode('menu');
        setGameSeedObjectId(null);
        setGameSeed(null);
    };

    // Handle skin selection
    const handleSelectSkin = (skinId) => {
        setSelectedSkin(skinId);
        localStorage.setItem('selectedSkin', skinId.toString());
        showToast('success', 'Skin selected!');
    };

    // Handle claim skin as NFT
    const handleClaimSkin = async (skin) => {
        if (!blockchain.account) {
            showToast('error', 'Please connect your wallet first!');
            return;
        }

        setIsClaimingSkin(true);
        try {
            const result = await blockchain.claimSkinNFT(skin.id, skin.name, skin.colors);
            showToast('success', `${skin.name} claimed as NFT! Check your wallet.`);
            return result;
        } catch (error) {
            console.error('Failed to claim skin:', error);
            showToast('error', error.message || 'Failed to claim skin NFT.');
            throw error;
        } finally {
            setIsClaimingSkin(false);
        }
    };

    return (
        <div className="app">
            {/* Wallet Info in Corner */}
            {blockchain.account && currentScreen !== 'landing' && (
                <div className="wallet-info-corner">
                    <span className="wallet-label">UID:</span>
                    <span className="wallet-address-short">
                        {blockchain.account.address.slice(0, 6)}...{blockchain.account.address.slice(-4)}
                    </span>
                </div>
            )}

            {/* Tutorial Modal */}
            {showTutorial && (
                <div className="tutorial-overlay" onClick={() => setShowTutorial(false)}>
                    <div className="tutorial-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="tutorial-close" onClick={() => setShowTutorial(false)}>×</button>
                        <h2>HOW TO PLAY</h2>
                        <div className="tutorial-content">
                            <h3>CONTROLS</h3>
                            <p><kbd>←</kbd> <kbd>→</kbd> Move piece left/right</p>
                            <p><kbd>↑</kbd> Rotate piece</p>
                            <p><kbd>↓</kbd> Soft drop (faster fall)</p>
                            <p><kbd>SPACE</kbd> Hard drop (instant fall)</p>
                            <p><kbd>P</kbd> Pause/Resume</p>
                            
                            <h3>GAMEPLAY</h3>
                            <p>• Clear lines by filling rows completely</p>
                            <p>• Score increases with each line cleared</p>
                            <p>• Level up every 10 lines (game speeds up)</p>
                            <p>• Game over when pieces stack to the top</p>
                            
                            <h3>BLOCKCHAIN</h3>
                            <p>• Connect wallet to record scores on-chain</p>
                            <p>• Each game gets a provably fair seed</p>
                            <p>• Submit scores to earn TETRI tokens</p>
                            <p>• Compete on the global leaderboard</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Landing Screen */}
            {currentScreen === 'landing' && (
                <div className="landing-screen">
                    <h1 className="game-title">TETRICHAIN</h1>
                    <p className="game-subtitle">WEB3 TETRIS ON SUI BLOCKCHAIN</p>
                    
                    <div className="landing-buttons">
                        <ConnectButton />
                        <button 
                            className="btn btn-secondary tutorial-btn"
                            onClick={() => setShowTutorial(true)}
                        >
                            HOW TO PLAY
                        </button>
                    </div>
                </div>
            )}

            {/* Main Menu Screen */}
            {currentScreen === 'menu' && (
                <div className="main-menu">
                    <h1 className="menu-title">TETRICHAIN</h1>
                    
                    {/* Mute Button - Simple style like back button */}
                    <button 
                        className="mute-toggle-button"
                        onClick={sound.toggleMute}
                    >
                        {sound.isMuted ? '🔇 SOUND OFF' : '🔊 SOUND ON'}
                    </button>
                    
                    <div className="menu-options">
                        <button 
                            className="menu-button solo-button"
                            onMouseEnter={() => sound.playHoverSound()}
                            onClick={() => {
                                sound.playClickSound();
                                setCurrentScreen('solo');
                            }}
                        >
                            <div className="menu-button-icon">1P</div>
                            <div className="menu-button-content">
                                <div className="menu-button-title">SOLO</div>
                                <div className="menu-button-subtitle">CHALLENGE YOURSELF AND TOP THE LEADERBOARDS</div>
                            </div>
                        </button>

                        <button 
                            className="menu-button multiplayer-button"
                            onMouseEnter={() => sound.playHoverSound()}
                            onClick={() => {
                                sound.playClickSound();
                                showToast('info', 'Multiplayer coming soon! Stay tuned for epic battles.');
                            }}
                        >
                            <div className="menu-button-icon">MP</div>
                            <div className="menu-button-content">
                                <div className="menu-button-title">MULTIPLAYER</div>
                                <div className="menu-button-subtitle">COMING SOON - PLAY ONLINE WITH FRIENDS</div>
                            </div>
                        </button>

                        <button 
                            className="menu-button config-button"
                            onMouseEnter={() => sound.playHoverSound()}
                            onClick={() => {
                                sound.playClickSound();
                                setCurrentScreen('customization');
                            }}
                        >
                            <div className="menu-button-icon">🎨</div>
                            <div className="menu-button-content">
                                <div className="menu-button-title">CUSTOMIZATION</div>
                                <div className="menu-button-subtitle">UNLOCK AND CLAIM BLOCK SKINS AS NFTS</div>
                            </div>
                        </button>

                        <button 
                            className="menu-button marketplace-button"
                            onMouseEnter={() => sound.playHoverSound()}
                            onClick={() => {
                                sound.playClickSound();
                                setCurrentScreen('marketplace');
                            }}
                        >
                            <div className="menu-button-icon">🛒</div>
                            <div className="menu-button-content">
                                <div className="menu-button-title">MARKETPLACE</div>
                                <div className="menu-button-subtitle">TRADE SKIN NFTS WITH OTHER PLAYERS</div>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* Solo Game Screen */}
            {currentScreen === 'solo' && (
                <div className="solo-screen">
                    <button 
                        className="btn btn-secondary back-button"
                        onClick={() => {
                            setCurrentScreen('menu');
                            setGameMode('menu');
                        }}
                    >
                        ← BACK TO MENU
                    </button>
                    
                    <div className="main-content">
                        <div className="game-section">
                            {gameMode === 'menu' && (
                                <div className="menu-screen">
                                    <h2>READY TO PLAY?</h2>
                                    {!blockchain.account ? (
                                        <div className="wallet-required">
                                            <p className="status-message error">⚠️ WALLET CONNECTION REQUIRED</p>
                                            <p className="wallet-required-text">You must connect your wallet to play TetriChain</p>
                                            <ConnectButton />
                                        </div>
                                    ) : (
                                        <>
                                            <p className="status-message connected">
                                                ✓ WALLET CONNECTED - READY TO PLAY!
                                            </p>
                                            <button 
                                                onClick={handleStartGame} 
                                                className="btn btn-primary start-button"
                                                disabled={blockchain.isCreatingGameSeed}
                                            >
                                                {blockchain.isCreatingGameSeed ? 'CREATING GAME SEED...' : 'START GAME'}
                                            </button>
                                        </>
                                    )}
                                    <div className="controls-info">
                                        <h3>CONTROLS</h3>
                                        <p><span>Move Left</span> <kbd>←</kbd></p>
                                        <p><span>Move Right</span> <kbd>→</kbd></p>
                                        <p><span>Rotate</span> <kbd>↑</kbd></p>
                                        <p><span>Soft Drop</span> <kbd>↓</kbd></p>
                                        <p><span>Hard Drop</span> <kbd>SPACE</kbd></p>
                                        <p><span>Pause</span> <kbd>P</kbd></p>
                                    </div>
                                </div>
                            )}

                            {gameMode === 'playing' && (
                                <>
                                    <GameInfo 
                                        score={game.gameState.score}
                                        level={game.gameState.level}
                                        lines={game.gameState.linesCleared}
                                        isPaused={game.gameState.isPaused}
                                        onPause={game.togglePause}
                                    />
                                    
                                    <div className="game-area-with-previews">
                                        {/* HOLD */}
                                        <div className="hold-container">
                                            <div className="preview-label">HOLD</div>
                                            <PiecePreview pieceType={game.gameState.holdPiece?.type} />
                                            <div className="preview-hint">Press C</div>
                                        </div>

                                        {/* GAME BOARD */}
                                        <GameBoard 
                                            grid={game.gameState.grid}
                                            currentPiece={game.gameState.currentPiece}
                                            ghostPiece={game.gameState.ghostPiece}
                                            isPaused={game.gameState.isPaused}
                                            clearingLines={game.clearingLines}
                                            renderTrigger={game.renderTrigger}
                                        />

                                        {/* NEXT */}
                                        <div className="next-container">
                                            <div className="preview-label">NEXT</div>
                                            {game.gameState.nextQueue && game.gameState.nextQueue.slice(0, 4).map((type, i) => (
                                                <PiecePreview key={i} pieceType={type} />
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {gameMode === 'gameOver' && (
                                <div className="game-over">
                                    <h2>Game Over!</h2>
                                    <p>Final Score: <span>{game.gameState.score.toLocaleString()}</span></p>
                                    <div className="game-over-actions">
                                        {blockchain.account && gameSeedObjectId && (
                                            <button 
                                                onClick={handleSubmitScore} 
                                                className="btn btn-primary"
                                                disabled={blockchain.isSubmittingScore}
                                            >
                                                {blockchain.isSubmittingScore ? 'SUBMITTING...' : 'SUBMIT TO BLOCKCHAIN'}
                                            </button>
                                        )}
                                        <button onClick={handlePlayAgain} className="btn btn-secondary">
                                            PLAY AGAIN
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="blockchain-section">
                            <WalletStatus 
                                account={blockchain.account}
                                balance={blockchain.playerBalance}
                                isLoadingBalance={blockchain.isLoadingBalance}
                                onRefreshBalance={blockchain.fetchPlayerBalance}
                            />
                            <Leaderboard 
                                scores={blockchain.leaderboard}
                                currentPlayerAddress={blockchain.account?.address}
                                isLoading={blockchain.isLoadingLeaderboard}
                                onRefresh={blockchain.fetchLeaderboard}
                                usernameMap={blockchain.account && blockchain.username ? {
                                    [blockchain.account.address]: blockchain.username
                                } : {}}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Multiplayer Screen */}
            {currentScreen === 'multiplayer' && (
                <div className="multiplayer-screen">
                    <button 
                        className="btn btn-secondary back-button"
                        onClick={() => {
                            battleFlow.resetBattle();
                            setCurrentScreen('menu');
                        }}
                    >
                        ← BACK TO MENU
                    </button>
                    
                    {/* Show Battle View if in battle */}
                    {battleFlow.battleState === 'playing' && battleFlow.roomData ? (
                        <BattleView
                            localPlayer={{ username: blockchain.username, address: blockchain.account?.address }}
                            localGameState={multiplayerBattle.localGameState}
                            opponentPlayer={{ username: battleFlow.opponentData?.username, address: battleFlow.opponentData?.address }}
                            opponentGameState={multiplayerBattle.opponentGameState}
                            wager={battleFlow.roomData?.wager}
                            onForfeit={() => battleFlow.forfeitBattle()}
                        />
                    ) : (
                        /* Show Multiplayer Menu for matchmaking */
                        <MultiplayerMenu
                            onRandomMatchmaking={(wager) => battleFlow.startMatchmaking(wager)}
                            onPrivateRoom={(wager) => battleFlow.createPrivateRoom(wager)}
                            matchmakingStatus={battleFlow.battleState}
                            estimatedWaitTime={battleFlow.estimatedWaitTime}
                            onCancel={() => battleFlow.cancelMatchmaking()}
                        />
                    )}
                </div>
            )}

            {/* Customization Screen */}
            {currentScreen === 'customization' && (
                <CustomizationMenu
                    onBack={() => setCurrentScreen('menu')}
                    onSkinSelect={(skin) => {
                        setSelectedSkin(skin);
                        console.log('Selected skin:', skin);
                    }}
                />
            )}

            {/* Marketplace Screen */}
            {currentScreen === 'marketplace' && (
                <MarketplaceView
                    onBack={() => setCurrentScreen('menu')}
                />
            )}

            {/* Username Registration Screen */}
            {currentScreen === 'username' && (
                <div className="username-screen">
                    <UsernameRegistrationModal
                        isOpen={true}
                        onClose={handleUsernameRegistered}
                        onRegister={async (username) => {
                            try {
                                await blockchain.registerUsername(username);
                                handleUsernameRegistered();
                            } catch (error) {
                                showToast('error', error.message || 'Failed to register username');
                                throw error;
                            }
                        }}
                        isRegistering={blockchain.isRegisteringUsername}
                    />
                </div>
            )}

            {/* Loading Overlay */}
            {(blockchain.isCreatingGameSeed || blockchain.isSubmittingScore) && (
                <LoadingOverlay message={loadingMessage} />
            )}

            {/* Toast Notifications */}
            {toast.show && (
                <Toast 
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}

            {/* Skin Unlock Notification */}
            <SkinUnlockNotification
                skin={skinUnlocks.newlyUnlocked}
                onClose={skinUnlocks.clearNotification}
            />
        </div>
    );
}

export default App;
