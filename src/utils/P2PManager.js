import { supabase } from './supabaseClient';

// Generate a short game code for sharing
const generateGameCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

class P2PManager {
  constructor() {
    this.channel = null;
    this.onDataCallback = null;
    this.onConnectionCallback = null;
    this.isHost = false;
    this.peerId = null;
    this.gameCode = null;
  }

  // Initialize as host — creates a new Supabase Realtime channel
  initHost(callback) {
    this.isHost = true;
    this.gameCode = generateGameCode();
    this.peerId = 'host_' + Math.random().toString(36).substring(2, 8);

    this.channel = supabase.channel(`game:${this.gameCode}`, {
      config: { broadcast: { self: false } },
    });

    this.channel
      .on('broadcast', { event: 'game_message' }, ({ payload }) => {
        console.log('Host received:', payload);
        if (this.onDataCallback) {
          // Wrap sender info in a conn-like object for compatibility
          const conn = { peer: payload.senderId };
          conn.send = (data) => this.sendTo(data);
          this.onDataCallback(payload.data, conn);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Host channel subscribed, game code:', this.gameCode);
          if (callback) callback(this.gameCode);
        }
      });
  }

  // Initialize as client — joins an existing channel by game code
  initClient(gameCode, callback) {
    this.isHost = false;
    this.gameCode = gameCode;
    this.peerId = 'client_' + Math.random().toString(36).substring(2, 8);

    this.channel = supabase.channel(`game:${gameCode}`, {
      config: { broadcast: { self: false } },
    });

    this.channel
      .on('broadcast', { event: 'game_message' }, ({ payload }) => {
        console.log('Client received:', payload);
        if (this.onDataCallback) {
          this.onDataCallback(payload.data);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Client subscribed to game:', gameCode);
          if (callback) callback(this.peerId);
        }
      });
  }

  // Broadcast data to all participants on the channel
  sendToAll(data) {
    if (!this.channel) return;
    this.channel.send({
      type: 'broadcast',
      event: 'game_message',
      payload: { data, senderId: this.peerId },
    });
  }

  // Alias used by host — in Supabase Realtime broadcast goes to everyone
  sendTo(data) {
    this.sendToAll(data);
  }

  // Broadcast data (same as sendToAll for Supabase channels)
  broadcast(data, _exceptPeerId = null) {
    this.sendToAll(data);
  }

  // Set callback for received data
  onData(callback) {
    this.onDataCallback = callback;
  }

  // Set callback for new connections (kept for API compatibility)
  onConnection(callback) {
    this.onConnectionCallback = callback;
  }

  // Disconnect from the channel
  disconnect() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
    }
    this.channel = null;
    this.peerId = null;
    this.gameCode = null;
  }
}

// Export as singleton for simple state management across the app.
export default new P2PManager();
