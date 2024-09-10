import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { v4 as uuidv4 } from 'uuid';

let io: Server;

export const userSessions: {
  [fid: number]: { sessionId: string; data: any; socket: any };
} = {};

export function initializeSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('A client connected');

    socket.on('register', (fid: number) => {
      if (!userSessions[fid]) {
        const sessionId = uuidv4();
        userSessions[fid] = { sessionId, data: {}, socket };
        console.log(`New session created for FID ${fid}: ${sessionId}`);
      } else {
        userSessions[fid].socket = socket;
      }

      socket.join(`user_${fid}`);
      console.log(
        `Client registered for FID ${fid}, SessionID: ${userSessions[fid].sessionId}`
      );

      // Send the current session data to the client
      socket.emit('userData', {
        sessionId: userSessions[fid].sessionId,
        data: userSessions[fid].data
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}
