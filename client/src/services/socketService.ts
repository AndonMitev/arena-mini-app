import io, { Socket } from 'socket.io-client';

const URL = 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  private listeners: { [event: string]: ((data: any) => void)[] } = {};
  private sessionId: string | null = null;

  connect(url: string = URL) {
    this.socket = io(url, {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('sessionCreated', ({ sessionId }) => {
      this.sessionId = sessionId;
      console.log(`Session created: ${sessionId}`);
      this.notifyListeners('sessionCreated', { sessionId });
    });

    this.socket.on('userData', ({ sessionId, fid, data }) => {
      if (sessionId === this.sessionId) {
        console.log(`Received userData for session ${sessionId}, FID: ${fid}:`, data);
        this.notifyListeners('userData', { fid, data });
      }
    });

    // ... rest of the code ...
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: (data: any) => void) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    }
  }

  private notifyListeners(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback(data));
    }
  }

  getSessionId(): string | null {
    return this.sessionId;
  }
}

export const socketService = new SocketService();
