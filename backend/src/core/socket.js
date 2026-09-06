import { Server } from 'socket.io';
import { env } from './env.js';
import { db } from './database.js';
import jwt from 'jsonwebtoken';

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Auth error'));
    try {
      const decoded = jwt.verify(token, env.jwtSecret);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] User ${socket.user.id} connected`);

    // Join room chat
    socket.on('join_room', async (roomId) => {
      // Verifikasi akses user ke room
      const member = await db.chatMember.findUnique({
        where: { roomId_userId: { roomId: parseInt(roomId), userId: socket.user.id } }
      });
      if (member) {
        socket.join(`chat_room_${roomId}`);
        console.log(`[Socket] User ${socket.user.id} joined chat_room_${roomId}`);
      }
    });

    socket.on('leave_room', (roomId) => {
      socket.leave(`chat_room_${roomId}`);
    });

    socket.on('send_message', async (data) => {
      const { roomId, message } = data;
      try {
        const msg = await db.chatMessage.create({
          data: {
            roomId: parseInt(roomId),
            senderId: socket.user.id,
            message
          },
          include: {
            sender: { include: { dosen: true, mahasiswa: true, prodiKelola: true } }
          }
        });
        io.to(`chat_room_${roomId}`).emit('new_message', msg);
      } catch (err) {
        console.error('[Socket] Error saving chat message:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User ${socket.user.id} disconnected`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
