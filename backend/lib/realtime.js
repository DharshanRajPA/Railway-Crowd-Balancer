import { Server } from 'socket.io';

let io = null;

/**
 * Initialize Socket.io server
 */
export function initRealtime(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });
  
  io.on('connection', (socket) => {
    console.log('[Socket.io] Client connected:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('[Socket.io] Client disconnected:', socket.id);
    });
  });
  
  console.log('[Socket.io] Server initialized');
}

/**
 * Emit event to all connected clients
 */
export function emit(event, data) {
  if (!io) {
    console.warn('[Socket.io] Cannot emit: Socket.io not initialized');
    return;
  }

  io.emit(event, data);
}

/**
 * Get Socket.io instance
 */
export function getIO() {
  return io;
}

