# PubGolf 🏌️🍺

A React Native app for playing Pub Golf with friends using peer-to-peer connections!

## Features

- **Create Games**: Set up your own pub golf course with custom holes and pars
- **Join Games**: Join a friend's game using a simple code
- **Peer-to-Peer**: No backend needed - everything runs peer-to-peer using PeerJS
- **Real-time Scoring**: Track scores for all players in real-time
- **No Accounts**: Just enter your name and start playing

## How to Play Pub Golf

Pub Golf is a drinking game where you visit multiple pubs (holes) and try to finish your drinks in as few "strokes" (sips) as possible. The par for each hole represents the target number of sips.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Frqcture/PubGolf.git
   cd PubGolf
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the app:
   ```bash
   npm start
   ```

4. Run on your device:
   - **iOS**: Press `i` in the terminal or scan the QR code with the Camera app
   - **Android**: Press `a` in the terminal or scan the QR code with the Expo Go app
   - **Web**: Press `w` in the terminal

## How to Use

### Creating a Game

1. Open the app and enter your name
2. Tap "Create New Game"
3. Set up your course by adding holes (pubs/locations) and their pars
4. Tap "Start Game"
5. Share the game code with your friends

### Joining a Game

1. Open the app and enter your name
2. Enter the game code provided by the host
3. Tap "Join Game"
4. Start tracking your scores!

### During the Game

- Each player can only edit their own scores
- All scores are synchronized in real-time via peer-to-peer connection
- The host is marked with a 👑 crown
- Your name is marked with "(You)"

## Technical Details

- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **P2P**: PeerJS for peer-to-peer connectivity
- **State Management**: React hooks
- **No Backend**: Completely serverless using WebRTC

## Development

The project structure:
- `App.js` - Main app component with navigation
- `src/screens/` - Screen components
  - `HomeScreen.js` - Welcome screen with create/join options
  - `GameSetupScreen.js` - Course setup for hosts
  - `GameScreen.js` - Main game screen with scorecard
- `src/utils/` - Utility functions
  - `P2PManager.js` - Peer-to-peer connection manager
  - `gameUtils.js` - Game state management utilities

## License

ISC