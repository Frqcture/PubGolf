import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Share,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import P2PManager from '../utils/P2PManager';
import { createNewGame, addPlayer, updateScore, calculateTotal } from '../utils/gameUtils';
import { saveCurrentGame, clearCurrentGame, removeFromActiveGames, getCurrentGame } from '../utils/storageUtils';

const GameScreen = ({ navigation, route }) => {
  const { playerName, holes, isHost, gameCode, resuming, myPlayerId: initialPlayerId } = route.params;
  const [game, setGame] = useState(null);
  const [myPlayerId, setMyPlayerId] = useState(initialPlayerId || null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isConnecting, setIsConnecting] = useState(!isHost && !resuming);
  const [activeTab, setActiveTab] = useState('myScore'); // 'myScore' or 'leaderboard'

  useEffect(() => {
    const initializeGame = async () => {
      // Try to resume from saved game first
      if (resuming && initialPlayerId) {
        // Load the saved game state
        const savedGame = await getCurrentGame();
        if (savedGame && savedGame.game) {
          setGame(savedGame.game);
        }
        
        // Reconnect to the game
        if (isHost) {
          P2PManager.initHost((hostGameCode) => {
            console.log('Host resumed with game code:', hostGameCode);
          });
          
          // Handle incoming data from clients
          P2PManager.onData((data, conn) => {
            console.log('Host received data:', data);
            
            if (data.type === 'JOIN_GAME') {
              // Validate and sanitize player name
              const joinName = String(data.playerName || 'Anonymous')
                .trim()
                .substring(0, 50)
                .replace(/[^\w\s-]/g, '');
              
              if (!joinName) {
                console.warn('Invalid player name received');
                return;
              }
              
              const joinerId = conn.peer;
              setGame(currentGame => {
                const updatedGame = addPlayer(currentGame, joinName, joinerId);
                // Broadcast updated game state to all players
                P2PManager.sendToAll({
                  type: 'GAME_STATE',
                  game: updatedGame,
                  yourPlayerId: joinerId,
                });
                
                // Save updated game
                saveCurrentGame({
                  game: updatedGame,
                  gameCode: P2PManager.gameCode,
                  playerName,
                  myPlayerId: currentGame.players[0].id,
                  isHost: true,
                  holes: currentGame.holes,
                });
                
                return updatedGame;
              });
            } else if (data.type === 'UPDATE_SCORE') {
              setGame(currentGame => {
                const updatedGame = updateScore(
                  currentGame,
                  data.playerId,
                  data.holeIndex,
                  data.score
                );
                // Broadcast updated state to all players
                P2PManager.sendToAll({
                  type: 'GAME_STATE',
                  game: updatedGame,
                });
                
                // Save updated game
                saveCurrentGame({
                  game: updatedGame,
                  gameCode: P2PManager.gameCode,
                  playerName,
                  myPlayerId: currentGame.players[0].id,
                  isHost: true,
                  holes: currentGame.holes,
                });
                
                return updatedGame;
              });
            } else if (data.type === 'LEAVE_GAME') {
              setGame(currentGame => {
                const updatedGame = {
                  ...currentGame,
                  players: currentGame.players.filter(p => p.id !== data.playerId),
                };
                // Broadcast updated state to all players
                P2PManager.sendToAll({
                  type: 'GAME_STATE',
                  game: updatedGame,
                });
                return updatedGame;
              });
            } else if (data.type === 'END_GAME') {
              handleGameEnded();
            }
          });
        } else {
          P2PManager.initClient(gameCode, (peerId) => {
            console.log('Client resumed with peer ID:', peerId);
          });
          
          // Set up data handler
          P2PManager.onData((data) => {
            console.log('Client received data:', data);
            
            if (data.type === 'GAME_STATE') {
              setGame(data.game);
              if (data.yourPlayerId) {
                setMyPlayerId(data.yourPlayerId);
                
                // Save game to local storage
                saveCurrentGame({
                  game: data.game,
                  gameCode,
                  playerName,
                  myPlayerId: data.yourPlayerId,
                  isHost: false,
                  holes: data.game.holes,
                });
              }
              setIsConnecting(false);
            } else if (data.type === 'END_GAME') {
              handleGameEnded();
            }
          });
        }
        return;
      }

      if (isHost && !resuming) {
      // Host creates the game
      const newGame = createNewGame(playerName, holes);
      setGame(newGame);
      
      // Initialize as host via Supabase Realtime
      P2PManager.initHost((hostGameCode) => {
        console.log('Host initialized with game code:', hostGameCode);
        setMyPlayerId(newGame.players[0].id);
        
        // Save game to local storage
        saveCurrentGame({
          game: newGame,
          gameCode: hostGameCode,
          playerName,
          myPlayerId: newGame.players[0].id,
          isHost: true,
          holes,
        });
        
        // Show share modal after a short delay
        setTimeout(() => setShowShareModal(true), 500);
      });

      // Handle incoming data from clients
      P2PManager.onData((data, conn) => {
        console.log('Host received data:', data);
        
        if (data.type === 'JOIN_GAME') {
          // Validate and sanitize player name
          const joinName = String(data.playerName || 'Anonymous')
            .trim()
            .substring(0, 50)
            .replace(/[^\w\s-]/g, '');
          
          if (!joinName) {
            console.warn('Invalid player name received');
            return;
          }
          
          const joinerId = conn.peer;
          setGame(currentGame => {
            const updatedGame = addPlayer(currentGame, joinName, joinerId);
            // Broadcast updated game state to all players
            P2PManager.sendToAll({
              type: 'GAME_STATE',
              game: updatedGame,
              yourPlayerId: joinerId,
            });
            
            // Save updated game
            saveCurrentGame({
              game: updatedGame,
              gameCode: P2PManager.gameCode,
              playerName,
              myPlayerId: currentGame.players[0].id,
              isHost: true,
              holes,
            });
            
            return updatedGame;
          });
        } else if (data.type === 'UPDATE_SCORE') {
          setGame(currentGame => {
            const updatedGame = updateScore(
              currentGame,
              data.playerId,
              data.holeIndex,
              data.score
            );
            // Broadcast updated state to all players
            P2PManager.sendToAll({
              type: 'GAME_STATE',
              game: updatedGame,
            });
            
            // Save updated game
            saveCurrentGame({
              game: updatedGame,
              gameCode: P2PManager.gameCode,
              playerName,
              myPlayerId: currentGame.players[0].id,
              isHost: true,
              holes,
            });
            
            return updatedGame;
          });
        } else if (data.type === 'LEAVE_GAME') {
          setGame(currentGame => {
            const updatedGame = {
              ...currentGame,
              players: currentGame.players.filter(p => p.id !== data.playerId),
            };
            // Broadcast updated state to all players
            P2PManager.sendToAll({
              type: 'GAME_STATE',
              game: updatedGame,
            });
            return updatedGame;
          });
        } else if (data.type === 'END_GAME') {
          handleGameEnded();
        }
      });

    } else if (!resuming) {
      // Client joins the game
      // Set up data handler before subscribing
      P2PManager.onData((data) => {
        console.log('Client received data:', data);
        
        if (data.type === 'GAME_STATE') {
          setGame(data.game);
          if (data.yourPlayerId) {
            setMyPlayerId(data.yourPlayerId);
            
            // Save game to local storage
            saveCurrentGame({
              game: data.game,
              gameCode,
              playerName,
              myPlayerId: data.yourPlayerId,
              isHost: false,
              holes: data.game.holes,
            });
          }
          setIsConnecting(false);
        } else if (data.type === 'END_GAME') {
          handleGameEnded();
        }
      });

      P2PManager.initClient(gameCode, (peerId) => {
        console.log('Client initialized with peer ID:', peerId);
        setMyPlayerId(peerId);
        
        // Send join request
        P2PManager.sendToAll({
          type: 'JOIN_GAME',
          playerName: playerName,
        });
      });
    }
    };

    initializeGame();

    // Cleanup on unmount
    // Note: We intentionally don't call P2PManager.disconnect() here to maintain
    // the connection when the user navigates away or the app backgrounds.
    // Disconnection is only done when explicitly leaving/ending the game.
    return () => {};
  }, []);

  const handleScoreChange = (playerId, holeIndex, score) => {
    const numScore = parseInt(score) || 0;
    const updatedGame = updateScore(game, playerId, holeIndex, numScore);
    setGame(updatedGame);

    // Save updated game
    saveCurrentGame({
      game: updatedGame,
      gameCode: P2PManager.gameCode || gameCode,
      playerName,
      myPlayerId,
      isHost,
      holes: updatedGame.holes,
    });

    // Broadcast score update
    P2PManager.sendToAll({
      type: 'UPDATE_SCORE',
      playerId,
      holeIndex,
      score: numScore,
    });
  };

  const handleLeaveGame = () => {
    Alert.alert(
      'Leave Game',
      'Are you sure you want to leave this game?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            // Notify others
            P2PManager.sendToAll({
              type: 'LEAVE_GAME',
              playerId: myPlayerId,
            });
            
            // Clean up local storage
            await clearCurrentGame();
            await removeFromActiveGames(P2PManager.gameCode || gameCode);
            
            // Disconnect and go back
            P2PManager.disconnect();
            navigation.navigate('Home');
          },
        },
      ]
    );
  };

  const handleEndGame = () => {
    Alert.alert(
      'End Game',
      'Are you sure you want to end this game for everyone?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Game',
          style: 'destructive',
          onPress: async () => {
            // Notify all players
            P2PManager.sendToAll({
              type: 'END_GAME',
            });
            
            // Clean up and go back
            handleGameEnded();
          },
        },
      ]
    );
  };

  const handleGameEnded = async () => {
    await clearCurrentGame();
    await removeFromActiveGames(P2PManager.gameCode || gameCode);
    P2PManager.disconnect();
    
    Alert.alert(
      'Game Ended',
      'The host has ended the game.',
      [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
    );
  };

  const getShareableCode = () => {
    return P2PManager.gameCode || 'Loading...';
  };

  const handleShare = async () => {
    const code = getShareableCode();
    try {
      await Share.share({
        message: `Join my Pub Golf game! Use code: ${code}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCopyCode = async () => {
    const code = getShareableCode();
    await Clipboard.setStringAsync(code);
    Alert.alert('Copied!', 'Game code copied to clipboard');
  };

  if (isConnecting) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Connecting to game...</Text>
          <Text style={styles.loadingSubtext}>Code: {gameCode}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!game) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading game...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const myPlayer = game.players.find(p => p.id === myPlayerId);
  const sortedPlayers = [...game.players].sort((a, b) => {
    const aTotal = calculateTotal(a.scores);
    const bTotal = calculateTotal(b.scores);
    return aTotal - bTotal;
  });

  const handleGoHome = () => {
    Alert.alert(
      'Return to Home',
      'Are you sure you want to return to the home screen? Your game will be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Go Home',
          onPress: () => navigation.navigate('Home'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.homeButton} 
          onPress={handleGoHome}
        >
          <Text style={styles.homeButtonText}>← Home</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>🏌️ Pub Golf</Text>
          <Text style={styles.gameCodeText}>Code: {P2PManager.gameCode || gameCode}</Text>
        </View>
        <View style={styles.headerRight}>
          {isHost && (
            <TouchableOpacity 
              style={styles.shareButton} 
              onPress={() => setShowShareModal(true)}
            >
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
          )}
          {isHost ? (
            <TouchableOpacity 
              style={styles.endButton} 
              onPress={handleEndGame}
            >
              <Text style={styles.endButtonText}>End</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.leaveButton} 
              onPress={handleLeaveGame}
            >
              <Text style={styles.leaveButtonText}>Leave</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'myScore' && styles.activeTab]}
          onPress={() => setActiveTab('myScore')}
        >
          <Text style={[styles.tabText, activeTab === 'myScore' && styles.activeTabText]}>
            My Score
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'leaderboard' && styles.activeTab]}
          onPress={() => setActiveTab('leaderboard')}
        >
          <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.activeTabText]}>
            Leaderboard
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content based on active tab */}
      {activeTab === 'myScore' ? (
        // My Score View - Table format with headers
        <ScrollView style={styles.scrollView}>
          <View style={styles.myScoreContainer}>
            {myPlayer && (
              <>
                <Text style={styles.playerNameTitle}>
                  {myPlayer.name} {myPlayer.isHost && '👑'}
                </Text>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderTextPub}>Pub</Text>
                  <Text style={styles.tableHeaderTextNum}>Par</Text>
                  <Text style={styles.tableHeaderTextNum}>Score</Text>
                  <Text style={styles.tableHeaderTextNum}>+/-</Text>
                </View>
                {/* Table Rows */}
                {game.holes.map((hole, index) => {
                  const score = myPlayer.scores[index] || 0;
                  const par = hole.par;
                  const diff = score > 0 ? score - par : 0;
                  const diffText = diff > 0 ? `+${diff}` : diff === 0 && score > 0 ? '0' : '';
                  
                  return (
                    <View key={index} style={styles.tableRow}>
                      <Text style={styles.tableCellPub}>{hole.name}</Text>
                      <Text style={styles.tableCellNum}>{hole.par}</Text>
                      <View style={styles.tableCellScore}>
                        <TextInput
                          style={styles.scoreInput}
                          value={score === 0 ? '' : String(score)}
                          onChangeText={(text) => 
                            handleScoreChange(myPlayer.id, index, text)
                          }
                          keyboardType="numeric"
                          placeholder="-"
                          placeholderTextColor="#999"
                        />
                      </View>
                      <Text style={[
                        styles.tableCellNum,
                        diff > 0 && styles.diffPositive,
                        diff < 0 && styles.diffNegative,
                      ]}>
                        {diffText}
                      </Text>
                    </View>
                  );
                })}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{calculateTotal(myPlayer.scores)}</Text>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      ) : (
        // Leaderboard View
        <ScrollView style={styles.scrollView}>
          <View style={styles.leaderboardContainer}>
            {sortedPlayers.map((player, position) => {
              const total = calculateTotal(player.scores);
              return (
                <View key={player.id} style={styles.leaderboardCard}>
                  <View style={styles.leaderboardHeader}>
                    <View style={styles.leaderboardLeft}>
                      <Text style={styles.positionText}>#{position + 1}</Text>
                      <Text style={styles.leaderboardPlayerName}>
                        {player.name} {player.isHost && '👑'}
                        {player.id === myPlayerId && ' (You)'}
                      </Text>
                    </View>
                    <Text style={styles.leaderboardTotal}>{total}</Text>
                  </View>
                  <View style={styles.scoresPreview}>
                    {player.scores.map((score, idx) => (
                      <Text key={idx} style={styles.scorePreviewText}>
                        {score || '-'}
                      </Text>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share Game Code</Text>
            <Text style={styles.modalSubtitle}>
              Others can join by entering this code:
            </Text>
            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>{getShareableCode()}</Text>
            </View>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
              <Text style={styles.copyButtonText}>Copy Code</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareModalButton} onPress={handleShare}>
              <Text style={styles.shareModalButtonText}>Share via...</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowShareModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a5f3f',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: 10,
  },
  homeButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  gameCodeText: {
    fontSize: 12,
    color: '#a8d5ba',
    marginTop: 2,
  },
  shareButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 10,
  },
  shareButtonText: {
    color: '#1a5f3f',
    fontWeight: 'bold',
    fontSize: 14,
  },
  leaveButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 10,
  },
  leaveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  endButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 10,
  },
  endButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#145238',
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#fff',
  },
  tabText: {
    color: '#a8d5ba',
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  myScoreContainer: {
    padding: 15,
  },
  playerNameTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#145238',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    alignItems: 'center',
  },
  tableHeaderTextPub: {
    flex: 2,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tableHeaderTextNum: {
    flex: 1,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  tableCellPub: {
    flex: 2,
    fontSize: 14,
    color: '#333',
  },
  tableCellNum: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
  },
  tableCellScore: {
    flex: 1,
    alignItems: 'center',
  },
  scoreInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    minWidth: 50,
    color: '#1a5f3f',
  },
  diffPositive: {
    color: '#e74c3c',
  },
  diffNegative: {
    color: '#27ae60',
  },
  totalRow: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: '#1a5f3f',
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a5f3f',
  },
  totalValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a5f3f',
  },
  leaderboardContainer: {
    padding: 15,
  },
  leaderboardCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  positionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a5f3f',
    marginRight: 10,
    width: 40,
  },
  leaderboardPlayerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  leaderboardTotal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a5f3f',
  },
  scoresPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  scorePreviewText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    marginRight: 5,
    marginBottom: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 10,
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#a8d5ba',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a5f3f',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  codeContainer: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  codeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a5f3f',
    letterSpacing: 3,
  },
  copyButton: {
    backgroundColor: '#1a5f3f',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
    width: '100%',
  },
  copyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  shareModalButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1a5f3f',
    marginBottom: 10,
    width: '100%',
  },
  shareModalButtonText: {
    color: '#1a5f3f',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  closeButton: {
    paddingVertical: 10,
  },
  closeButtonText: {
    color: '#999',
    fontSize: 14,
  },
});

export default GameScreen;
