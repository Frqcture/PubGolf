import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';

const HomeScreen = ({ navigation }) => {
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');

  const handleCreateGame = () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    navigation.navigate('GameSetup', { playerName: playerName.trim() });
  };

  const handleJoinGame = () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!gameCode.trim()) {
      Alert.alert('Error', 'Please enter a game code');
      return;
    }
    navigation.navigate('Game', { 
      playerName: playerName.trim(), 
      gameCode: gameCode.trim(),
      isHost: false 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🏌️ Pub Golf</Text>
        <Text style={styles.subtitle}>The Ultimate Drinking Game</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Your Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={playerName}
            onChangeText={setPlayerName}
            autoCapitalize="words"
          />
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleCreateGame}>
          <Text style={styles.primaryButtonText}>Create New Game</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Game Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter game code"
            value={gameCode}
            onChangeText={setGameCode}
            autoCapitalize="characters"
          />
        </View>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleJoinGame}>
          <Text style={styles.secondaryButtonText}>Join Game</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a5f3f',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#a8d5ba',
    textAlign: 'center',
    marginBottom: 50,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#1a5f3f',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#a8d5ba',
  },
  dividerText: {
    color: '#a8d5ba',
    paddingHorizontal: 10,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
