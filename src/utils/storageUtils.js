import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_GAMES_KEY = '@pubgolf:active_games';
const CURRENT_GAME_KEY = '@pubgolf:current_game';

// Save the current game state
export const saveCurrentGame = async (gameData) => {
  try {
    const gameString = JSON.stringify(gameData);
    await AsyncStorage.setItem(CURRENT_GAME_KEY, gameString);
    
    // Also update in active games list
    await addToActiveGames(gameData);
  } catch (error) {
    console.error('Error saving game:', error);
  }
};

// Get the current game state
export const getCurrentGame = async () => {
  try {
    const gameString = await AsyncStorage.getItem(CURRENT_GAME_KEY);
    return gameString ? JSON.parse(gameString) : null;
  } catch (error) {
    console.error('Error loading game:', error);
    return null;
  }
};

// Clear the current game
export const clearCurrentGame = async () => {
  try {
    await AsyncStorage.removeItem(CURRENT_GAME_KEY);
  } catch (error) {
    console.error('Error clearing game:', error);
  }
};

// Get all active games
export const getActiveGames = async () => {
  try {
    const gamesString = await AsyncStorage.getItem(ACTIVE_GAMES_KEY);
    return gamesString ? JSON.parse(gamesString) : [];
  } catch (error) {
    console.error('Error loading active games:', error);
    return [];
  }
};

// Add or update a game in active games list
export const addToActiveGames = async (gameData) => {
  try {
    const games = await getActiveGames();
    const existingIndex = games.findIndex(g => g.gameCode === gameData.gameCode);
    
    const gameInfo = {
      gameCode: gameData.gameCode,
      playerName: gameData.playerName,
      myPlayerId: gameData.myPlayerId,
      isHost: gameData.isHost,
      holes: gameData.game?.holes || gameData.holes,
      playerCount: gameData.game?.players?.length || 1,
      lastUpdated: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      games[existingIndex] = gameInfo;
    } else {
      games.push(gameInfo);
    }
    
    await AsyncStorage.setItem(ACTIVE_GAMES_KEY, JSON.stringify(games));
  } catch (error) {
    console.error('Error adding to active games:', error);
  }
};

// Remove a game from active games
export const removeFromActiveGames = async (gameCode) => {
  try {
    const games = await getActiveGames();
    const filtered = games.filter(g => g.gameCode !== gameCode);
    await AsyncStorage.setItem(ACTIVE_GAMES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing from active games:', error);
  }
};
