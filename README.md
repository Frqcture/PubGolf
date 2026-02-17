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

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo Go app (for testing on physical devices)
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Frqcture/PubGolf.git
   cd PubGolf
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Run on your device:
   - **iOS Simulator**: Press `i` in the terminal (requires Xcode on macOS)
   - **Android Emulator**: Press `a` in the terminal (requires Android Studio)
   - **Physical Device**: 
     - Install Expo Go app on your phone
     - Scan the QR code displayed in the terminal
   - **Web Browser**: Press `w` in the terminal

### Troubleshooting

- If you encounter issues with PeerJS connections, ensure both devices are on the same network or have internet connectivity
- The peer-to-peer connection uses public STUN servers, so an internet connection is required
- If the QR code doesn't scan, you can manually enter the URL shown in the terminal

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

### Architecture

- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Native Stack Navigator)
- **P2P Communication**: PeerJS for peer-to-peer connectivity via WebRTC
- **State Management**: React hooks (useState, useEffect)
- **No Backend**: Completely serverless - all game state is synchronized peer-to-peer

### How Peer-to-Peer Works

1. **Game Creation**: When a host creates a game, they initialize a PeerJS connection and receive a unique peer ID
2. **Game Joining**: Players join by connecting to the host's peer ID (the game code)
3. **Data Synchronization**: 
   - When a new player joins, the host sends them the complete game state
   - Score updates are broadcast from the player who made the change
   - The host relays all updates to ensure all players stay in sync
4. **Connection**: Uses WebRTC with public STUN servers for NAT traversal

### Project Structure

```
PubGolf/
├── App.js                      # Main app with navigation setup
├── app.json                    # Expo configuration
├── package.json                # Dependencies and scripts
├── assets/                     # App icons and images
└── src/
    ├── screens/
    │   ├── HomeScreen.js       # Welcome screen (create/join)
    │   ├── GameSetupScreen.js  # Course setup for hosts
    │   └── GameScreen.js       # Main game with scorecard
    └── utils/
        ├── P2PManager.js       # Peer-to-peer connection manager
        └── gameUtils.js        # Game state utilities
```

### Key Components

- **P2PManager**: Singleton class managing all peer-to-peer connections
- **HomeScreen**: Entry point for creating or joining games
- **GameSetupScreen**: Allows hosts to configure holes (pubs) and pars
- **GameScreen**: Real-time scorecard with live updates via P2P

## Future Improvements

Potential enhancements for future versions:

- **QR Code Sharing**: Generate QR codes for easier game joining
- **Game History**: Save completed games locally
- **Statistics**: Track personal bests and statistics
- **Themes**: Customizable color schemes
- **Sound Effects**: Audio feedback for score updates
- **Offline Mode**: Save game state locally for network interruptions
- **Custom Pars**: Add drink descriptions or special rules per hole
- **Leaderboard**: Enhanced sorting and ranking display
- **Profile Pictures**: Add avatars for players

## Development

### Running in Development Mode

```bash
npm start
```

This will start the Expo development server. You can then:
- Press `i` for iOS simulator
- Press `a` for Android emulator  
- Press `w` for web browser
- Scan QR code with Expo Go app on your phone

### Code Structure

The codebase follows a simple, modular structure:
- **Screens**: Each screen is a self-contained component in `src/screens/`
- **Utils**: Shared utilities and managers in `src/utils/`
- **Styling**: Inline StyleSheet objects for React Native styling

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC