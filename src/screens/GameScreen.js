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
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import P2PManager from '../utils/P2PManager';
import { createNewGame, addPlayer, updateScore, calculateTotal } from '../utils/gameUtils';

const GameScreen = ({ navigation, route }) => {
  const { playerName, holes, isHost, gameCode } = route.params;
  const [game, setGame] = useState(null);
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isConnecting, setIsConnecting] = useState(!isHost);

  useEffect(() => {
    if (isHost) {
      // Host creates the game
      const newGame = createNewGame(playerName, holes);
      setGame(newGame);
      
      // Initialize P2P as host
      P2PManager.initHost((peerId) => {
        console.log('Host initialized with peer ID:', peerId);
        setMyPlayerId(newGame.players[0].id);
        
        // Show share modal after a short delay
        setTimeout(() => setShowShareModal(true), 500);
      });

      // Handle incoming data from clients
      P2PManager.onData((data, conn) => {
        console.log('Host received data:', data);
        
        if (data.type === 'JOIN_GAME') {
          // Validate and sanitize player name
          const playerName = String(data.playerName || 'Anonymous')
            .trim()
            .substring(0, 50) // Limit to 50 characters
            .replace(/[^\w\s-]/g, ''); // Remove special characters except spaces and hyphens
          
          if (!playerName) {
            console.warn('Invalid player name received');
            return;
          }
          
          setGame(currentGame => {
            const updatedGame = addPlayer(currentGame, playerName, conn.peer);
            // Send current game state to the new player
            conn.send({
              type: 'GAME_STATE',
              game: updatedGame,
              yourPlayerId: conn.peer,
            });
            // Broadcast update to all other players
            P2PManager.broadcast({
              type: 'GAME_STATE',
              game: updatedGame,
            }, conn.peer);
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
            return updatedGame;
          });
        }
      });

    } else {
      // Client joins the game
      P2PManager.initClient(gameCode, (peerId) => {
        console.log('Client initialized with peer ID:', peerId);
        setMyPlayerId(peerId);
        
        // Send join request
        P2PManager.sendToAll({
          type: 'JOIN_GAME',
          playerName: playerName,
        });
      });

      // Handle incoming data from host
      P2PManager.onData((data) => {
        console.log('Client received data:', data);
        
        if (data.type === 'GAME_STATE') {
          setGame(data.game);
          if (data.yourPlayerId) {
            setMyPlayerId(data.yourPlayerId);
          }
          setIsConnecting(false);
        }
      });
    }

    // Cleanup on unmount
    // Note: This disconnects P2P when leaving the game screen.
    // In a production app, you might want to use navigation lifecycle events
    // to only disconnect when truly exiting the game (not just navigating away).
    return () => {
      P2PManager.disconnect();
    };
  }, []);

  const handleScoreChange = (playerId, holeIndex, score) => {
    const numScore = parseInt(score) || 0;
    const updatedGame = updateScore(game, playerId, holeIndex, numScore);
    setGame(updatedGame);

    // Broadcast score update
    P2PManager.sendToAll({
      type: 'UPDATE_SCORE',
      playerId,
      holeIndex,
      score: numScore,
    });
  };

  const getShareableCode = () => {
    return P2PManager.peerId || 'Loading...';
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏌️ Pub Golf</Text>
        {isHost && (
          <TouchableOpacity 
            style={styles.shareButton} 
            onPress={() => setShowShareModal(true)}
          >
            <Text style={styles.shareButtonText}>Share Code</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal style={styles.scrollView}>
        <View>
          {/* Header row with hole names */}
          <View style={styles.tableHeader}>
            <View style={styles.playerNameHeader}>
              <Text style={styles.headerText}>Player</Text>
            </View>
            {game.holes.map((hole, index) => (
              <View key={index} style={styles.holeHeader}>
                <Text style={styles.headerText}>{hole.name}</Text>
                <Text style={styles.parText}>Par {hole.par}</Text>
              </View>
            ))}
            <View style={styles.totalHeader}>
              <Text style={styles.headerText}>Total</Text>
            </View>
          </View>

          {/* Player rows */}
          {game.players.map((player) => (
            <View key={player.id} style={styles.playerRow}>
              <View style={styles.playerNameCell}>
                <Text style={styles.playerName}>
                  {player.name}
                  {player.id === myPlayerId && ' (You)'}
                  {player.isHost && ' 👑'}
                </Text>
              </View>
              {player.scores.map((score, holeIndex) => (
                <View key={holeIndex} style={styles.scoreCell}>
                  <TextInput
                    style={styles.scoreInput}
                    value={score === 0 ? '' : String(score)}
                    onChangeText={(text) => 
                      handleScoreChange(player.id, holeIndex, text)
                    }
                    keyboardType="numeric"
                    editable={player.id === myPlayerId}
                  />
                </View>
              ))}
              <View style={styles.totalCell}>
                <Text style={styles.totalText}>
                  {calculateTotal(player.scores)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  shareButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  shareButtonText: {
    color: '#1a5f3f',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#145238',
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
  },
  playerNameHeader: {
    width: 150,
    padding: 15,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#fff',
  },
  holeHeader: {
    width: 100,
    padding: 15,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#fff',
  },
  totalHeader: {
    width: 80,
    padding: 15,
    justifyContent: 'center',
    backgroundColor: '#0f3d28',
  },
  headerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  parText: {
    color: '#a8d5ba',
    fontSize: 12,
    marginTop: 2,
  },
  playerRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  playerNameCell: {
    width: 150,
    padding: 15,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    backgroundColor: '#f8f8f8',
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  scoreCell: {
    width: 100,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  scoreInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    padding: 8,
    fontSize: 16,
    textAlign: 'center',
    width: 60,
  },
  totalCell: {
    width: 80,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a5f3f',
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
