
// src/lib/socket-server.ts
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { Server, type Socket } from 'socket.io';

let io: Server | null = null;

export function initSocketIO(server: HttpServer | HttpsServer) {
  if (io) {
    console.log('Socket.IO already initialized.');
    return io;
  }

  io = new Server(server, {
    path: '/api/socket_io',
    addTrailingSlash: false,
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket: Socket) => {
    console.log('A client connected:', socket.id);

    socket.on('join_room', (room: string) => {
      console.log(`Client ${socket.id} joining room ${room}`);
      socket.join(room);
    });

    socket.on('disconnect', () => {
      console.log('A client disconnected:', socket.id);
    });
  });

  console.log('Socket.IO server initialized.');
  return io;
}

export function getIo() {
  if (!io) {
    throw new Error('Socket.IO not initialized!');
  }
  return io;
}
