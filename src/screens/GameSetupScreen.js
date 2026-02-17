import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';

const GameSetupScreen = ({ navigation, route }) => {
  const { playerName } = route.params;
  const [holes, setHoles] = useState([
    { name: 'Hole 1', par: 3 },
    { name: 'Hole 2', par: 4 },
    { name: 'Hole 3', par: 5 },
    { name: 'Hole 4', par: 3 },
    { name: 'Hole 5', par: 4 },
    { name: 'Hole 6', par: 5 },
    { name: 'Hole 7', par: 3 },
    { name: 'Hole 8', par: 4 },
    { name: 'Hole 9', par: 5 },
  ]);

  const updateHole = (index, field, value) => {
    const newHoles = [...holes];
    newHoles[index] = { ...newHoles[index], [field]: value };
    setHoles(newHoles);
  };

  const addHole = () => {
    setHoles([...holes, { name: `Hole ${holes.length + 1}`, par: 3 }]);
  };

  const removeHole = (index) => {
    if (holes.length <= 1) {
      Alert.alert('Error', 'You need at least one hole');
      return;
    }
    const newHoles = holes.filter((_, i) => i !== index);
    setHoles(newHoles);
  };

  const handleStartGame = () => {
    // Validate holes
    const invalidHole = holes.find(h => !h.name.trim() || !h.par || h.par < 1);
    if (invalidHole) {
      Alert.alert('Error', 'Please fill in all hole names and pars (min par: 1)');
      return;
    }

    navigation.navigate('Game', {
      playerName,
      holes,
      isHost: true,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Setup Your Course</Text>
          <Text style={styles.subtitle}>Create your pub golf holes</Text>
        </View>

        {holes.map((hole, index) => (
          <View key={index} style={styles.holeCard}>
            <View style={styles.holeHeader}>
              <Text style={styles.holeNumber}>Hole {index + 1}</Text>
              <TouchableOpacity onPress={() => removeHole(index)}>
                <Text style={styles.removeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Pub/Location name"
              value={hole.name}
              onChangeText={(text) => updateHole(index, 'name', text)}
            />
            <View style={styles.parContainer}>
              <Text style={styles.parLabel}>Par (drinks):</Text>
              <TextInput
                style={styles.parInput}
                placeholder="Par"
                value={String(hole.par)}
                onChangeText={(text) => {
                  const num = parseInt(text) || 0;
                  updateHole(index, 'par', num);
                }}
                keyboardType="numeric"
              />
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addHole}>
          <Text style={styles.addButtonText}>+ Add Another Hole</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
          <Text style={styles.startButtonText}>Start Game</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a5f3f',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#a8d5ba',
  },
  holeCard: {
    backgroundColor: '#fff',
    margin: 15,
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
  },
  holeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  holeNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a5f3f',
  },
  removeButton: {
    fontSize: 24,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  parContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  parLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 10,
  },
  parInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    width: 80,
  },
  addButton: {
    backgroundColor: 'transparent',
    margin: 15,
    marginTop: 5,
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 25,
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#1a5f3f',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default GameSetupScreen;
