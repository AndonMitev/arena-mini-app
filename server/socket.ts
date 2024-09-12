import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { v4 as uuidv4 } from 'uuid';

export const userSessions: {
  [sessionId: string]: { fid: number | null; data: any; socket: Socket };
} = {};

let io: Server;

export const initializeSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {
    const sessionId = uuidv4();
    console.log('A user connected', socket.id, 'Session:', sessionId);

    userSessions[sessionId] = { fid: null, data: {}, socket };

    socket.emit('sessionCreated', { sessionId });

    socket.on('disconnect', () => {
      console.log('User disconnected', socket.id, 'Session:', sessionId);
      delete userSessions[sessionId];
    });
  });
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
