import Peer from 'peerjs';

class P2PManager {
  constructor() {
    this.peer = null;
    this.connections = [];
    this.onDataCallback = null;
    this.onConnectionCallback = null;
    this.isHost = false;
    this.peerId = null;
  }

  // Initialize as host
  initHost(callback) {
    this.peer = new Peer();
    this.isHost = true;

    this.peer.on('open', (id) => {
      console.log('Host peer ID:', id);
      this.peerId = id;
      if (callback) callback(id);
    });

    this.peer.on('connection', (conn) => {
      console.log('New connection from:', conn.peer);
      this.setupConnection(conn);
      if (this.onConnectionCallback) {
        this.onConnectionCallback(conn);
      }
    });

    this.peer.on('error', (err) => {
      console.error('Peer error:', err);
    });
  }

  // Initialize as client and connect to host
  initClient(hostId, callback) {
    this.peer = new Peer();
    this.isHost = false;

    this.peer.on('open', (id) => {
      console.log('Client peer ID:', id);
      this.peerId = id;
      const conn = this.peer.connect(hostId);
      this.setupConnection(conn);
      if (callback) callback(id);
    });

    this.peer.on('error', (err) => {
      console.error('Peer error:', err);
    });
  }

  setupConnection(conn) {
    conn.on('open', () => {
      console.log('Connection opened with:', conn.peer);
      this.connections.push(conn);
    });

    conn.on('data', (data) => {
      console.log('Received data:', data);
      if (this.onDataCallback) {
        this.onDataCallback(data, conn);
      }
      
      // If host, broadcast to all other connections
      if (this.isHost) {
        this.broadcast(data, conn.peer);
      }
    });

    conn.on('close', () => {
      console.log('Connection closed with:', conn.peer);
      this.connections = this.connections.filter(c => c.peer !== conn.peer);
    });

    conn.on('error', (err) => {
      console.error('Connection error:', err);
    });
  }

  // Broadcast data to all connections except the sender
  broadcast(data, exceptPeerId = null) {
    this.connections.forEach(conn => {
      if (conn.peer !== exceptPeerId && conn.open) {
        conn.send(data);
      }
    });
  }

  // Send data to all connections
  sendToAll(data) {
    this.connections.forEach(conn => {
      if (conn.open) {
        conn.send(data);
      }
    });
  }

  // Set callback for received data
  onData(callback) {
    this.onDataCallback = callback;
  }

  // Set callback for new connections
  onConnection(callback) {
    this.onConnectionCallback = callback;
  }

  // Disconnect all
  disconnect() {
    this.connections.forEach(conn => conn.close());
    if (this.peer) {
      this.peer.destroy();
    }
    this.connections = [];
    this.peer = null;
    this.peerId = null;
  }
}

export default new P2PManager();
