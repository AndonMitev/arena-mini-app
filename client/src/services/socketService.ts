import io, { Socket } from 'socket.io-client';

// const URL = 'http://localhost:3000'
const URL = 'https://arena-mini-app-server.vercel.app';
class SocketService {
  private socket: Socket | null = null;
  private listeners: { [event: string]: ((data: any) => void)[] } = {};
  private sessionId: string | null = null;
  private currentFid: number | null = null;

  connect(url: string = URL) {
    this.socket = io(url, {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      if (this.currentFid) {
        this.register(this.currentFid);
      }
    });

    this.socket.on('userData', ({ sessionId, data }) => {
      this.sessionId = sessionId;
      console.log(`Received userData for session ${sessionId}:`, data);
      this.notifyListeners('userData', data);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
  }

  register(fid: number) {
    this.currentFid = fid;
    if (this.socket && this.socket.connected) {
      this.socket.emit('register', fid);
    }
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

  getCurrentFid(): number | null {
    return this.currentFid;
  }
}

export const socketService = new SocketService();
