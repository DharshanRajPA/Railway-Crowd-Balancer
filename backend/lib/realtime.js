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
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/29840694-9044-4d03-9b89-358de3fe5abe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'realtime.js:emit',message:'Emitting socket event',data:{event,dataCount:Object.keys(data||{}).length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  io.emit(event, data);
}

/**
 * Get Socket.io instance
 */
export function getIO() {
  return io;
}

