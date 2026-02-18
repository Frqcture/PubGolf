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
    
    // Rate limiting: Track last message time
    this.lastMessageTime = 0;
    this.messageQueue = [];
    this.isProcessingQueue = false;
    this.minMessageInterval = 100; // 100ms between messages (max 10/sec)
    
    // Message size limit
    this.maxMessageSize = 10240; // 10KB
    
    // Channel cleanup: Auto-disconnect after inactivity
    this.inactivityTimeout = 2 * 60 * 60 * 1000; // 2 hours
    this.lastActivityTime = Date.now();
    this.cleanupTimer = null;
  }

  // Initialize as host — creates a new Supabase Realtime channel
  initHost(callback) {
    this.isHost = true;
    this.gameCode = generateGameCode();
    this.peerId = 'host_' + Math.random().toString(36).substring(2, 8);

    this.channel = supabase.channel(`game:${this.gameCode}`, {
      config: { broadcast: { self: true } },
    });

    this.channel
      .on('broadcast', { event: 'game_message' }, ({ payload }) => {
        console.log('Host received:', payload);
        this.updateActivity();
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
          this.startInactivityTimer();
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
      config: { broadcast: { self: true } },
    });

    this.channel
      .on('broadcast', { event: 'game_message' }, ({ payload }) => {
        console.log('Client received:', payload);
        this.updateActivity();
        if (this.onDataCallback) {
          this.onDataCallback(payload.data);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Client subscribed to game:', gameCode);
          this.startInactivityTimer();
          if (callback) callback(this.peerId);
        }
      });
  }

  // Validate message size
  validateMessageSize(data) {
    const payload = { data, senderId: this.peerId };
    const size = JSON.stringify(payload).length;
    if (size > this.maxMessageSize) {
      console.warn(`Message size ${size} bytes exceeds limit of ${this.maxMessageSize} bytes`);
      return false;
    }
    return true;
  }

  // Process message queue with rate limiting
  async processMessageQueue() {
    if (this.isProcessingQueue || this.messageQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    while (this.messageQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastMessage = now - this.lastMessageTime;
      
      if (timeSinceLastMessage < this.minMessageInterval) {
        // Wait before sending next message
        await new Promise(resolve => 
          setTimeout(resolve, this.minMessageInterval - timeSinceLastMessage)
        );
      }
      
      const data = this.messageQueue.shift();
      if (this.channel) {
        this.channel.send({
          type: 'broadcast',
          event: 'game_message',
          payload: { data, senderId: this.peerId },
        });
        this.lastMessageTime = Date.now();
        this.updateActivity();
      }
    }
    
    this.isProcessingQueue = false;
  }

  // Broadcast data to all participants on the channel
  sendToAll(data) {
    if (!this.channel) return;
    
    // Validate message size
    if (!this.validateMessageSize(data)) {
      console.error('Message rejected: exceeds size limit');
      return;
    }
    
    // Add to queue for rate-limited sending
    this.messageQueue.push(data);
    this.processMessageQueue();
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

  // Update activity timestamp and reset cleanup timer
  updateActivity() {
    this.lastActivityTime = Date.now();
  }

  // Start inactivity timer for auto-cleanup
  startInactivityTimer() {
    this.stopInactivityTimer();
    
    this.cleanupTimer = setInterval(() => {
      const inactiveTime = Date.now() - this.lastActivityTime;
      if (inactiveTime >= this.inactivityTimeout) {
        console.log('Channel inactive for 2 hours, auto-disconnecting...');
        this.disconnect();
      }
    }, 60000); // Check every minute
  }

  // Stop inactivity timer
  stopInactivityTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  // Disconnect from the channel
  disconnect() {
    this.stopInactivityTimer();
    if (this.channel) {
      supabase.removeChannel(this.channel);
    }
    this.channel = null;
    this.peerId = null;
    this.gameCode = null;
    this.messageQueue = [];
  }
}

// Export as singleton for simple state management across the app.
export default new P2PManager();
