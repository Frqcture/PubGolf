export const generateGameId = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const createNewGame = (playerName, holes) => {
  return {
    gameId: generateGameId(),
    holes: holes,
    players: [
      {
        id: Math.random().toString(36).substring(2),
        name: playerName,
        scores: new Array(holes.length).fill(0),
        isHost: true,
      }
    ],
    currentHole: 0,
  };
};

export const addPlayer = (game, playerName, peerId) => {
  return {
    ...game,
    players: [
      ...game.players,
      {
        id: peerId || Math.random().toString(36).substring(2),
        name: playerName,
        scores: new Array(game.holes.length).fill(0),
        isHost: false,
      }
    ]
  };
};

export const updateScore = (game, playerId, holeIndex, score) => {
  return {
    ...game,
    players: game.players.map(player => 
      player.id === playerId
        ? { ...player, scores: player.scores.map((s, i) => i === holeIndex ? score : s) }
        : player
    )
  };
};

export const calculateTotal = (scores) => {
  return scores.reduce((sum, score) => sum + score, 0);
};
