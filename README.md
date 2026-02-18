# PubGolf 🏌️🍺

A React Native app for playing Pub Golf with friends using peer-to-peer connections!

## Features

- **Create Games**: Set up your own pub golf course with custom holes and pars
- **Join Games**: Join a friend's game using a simple code
- **Resume Games**: Games are saved locally - resume anytime even after closing the app
- **My Score View**: Clean, vertical layout to track your own scores with large input fields
- **Leaderboard**: Separate tab to view all players ranked by total score
- **Real-time Sync**: All scores synchronized in real-time via Supabase Realtime
- **Leave Game**: Non-hosts can leave a game they've joined
- **End Game**: Hosts can end the game for all players
- **No Accounts**: Just enter your name and start playing
- **Local Storage**: Games persist on your device even when the app is closed

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

- If you encounter connection issues, ensure you have a stable internet connection (required for Supabase Realtime)
- Games are saved locally - you can resume them even without internet, but live sync requires connectivity
- If the QR code doesn't scan, you can manually enter the URL shown in the terminal
- To clear saved games, you may need to clear app data or reinstall the app

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

- **Two Viewing Modes**:
  - **My Score Tab**: View and edit only your own scores in a clean vertical layout
  - **Leaderboard Tab**: See all players ranked by total score
- Each player can only edit their own scores
- All scores are synchronized in real-time via Supabase Realtime
- The host is marked with a 👑 crown
- Your name is marked with "(You)"
- **Game Management**:
  - Non-host players can leave the game using the "Leave" button
  - The host can end the game for everyone using the "End" button
- **Persistence**: Games are automatically saved to your device and can be resumed from the home screen

## Technical Details

### Architecture

- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Native Stack Navigator)
- **Real-time Communication**: Supabase Realtime for game state synchronization
- **Local Storage**: AsyncStorage for persisting game state on device
- **State Management**: React hooks (useState, useEffect)
- **Minimal Backend**: Uses Supabase only for real-time messaging, no database storage

### How Real-time Sync Works

1. **Game Creation**: When a host creates a game, they initialize a Supabase Realtime channel with a unique game code
2. **Game Joining**: Players join by subscribing to the same channel using the game code
3. **Data Synchronization**: 
   - When a new player joins, the host sends them the complete game state
   - Score updates are broadcast to all subscribers on the channel
   - The host maintains the authoritative game state
4. **Persistence**: All game state is saved locally on each device using AsyncStorage
5. **Resume**: When the app is reopened, active games are shown and can be rejoined

### Project Structure

```
PubGolf/
├── App.js                      # Main app with navigation setup
├── app.json                    # Expo configuration
├── package.json                # Dependencies and scripts
├── assets/                     # App icons and images
└── src/
    ├── screens/
    │   ├── HomeScreen.js       # Welcome screen (create/join/resume)
    │   ├── GameSetupScreen.js  # Course setup for hosts
    │   └── GameScreen.js       # Game with tabs (My Score/Leaderboard)
    └── utils/
        ├── P2PManager.js       # Supabase Realtime connection manager
        ├── gameUtils.js        # Game state utilities
        └── storageUtils.js     # AsyncStorage persistence utilities
```

### Key Components

- **P2PManager**: Singleton class managing Supabase Realtime connections and broadcasting
- **storageUtils**: Local persistence utilities using AsyncStorage
- **HomeScreen**: Entry point for creating, joining, or resuming games
- **GameSetupScreen**: Allows hosts to configure holes (pubs) and pars
- **GameScreen**: Two-tab interface with "My Score" and "Leaderboard" views

## Future Improvements

Potential enhancements for future versions:

- **QR Code Sharing**: Generate QR codes for easier game joining
- **Game History**: View completed game results and statistics
- **Statistics**: Track personal bests and long-term statistics
- **Themes**: Customizable color schemes
- **Sound Effects**: Audio feedback for score updates
- **Custom Pars**: Add drink descriptions or special rules per hole
- **Enhanced Leaderboard**: Show score differentials and par tracking
- **Profile Pictures**: Add avatars for players
- **In-game Chat**: Text messaging between players

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