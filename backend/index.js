require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  cors: { 
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const rooms = new Map();
const roomMeta = new Map();
const userNames = new Map();

const broadcastRooms = () => {
  io.emit('rooms', { rooms: Array.from(rooms.keys()) });
};

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on('join-room', ({ roomId, userName }) => {
    socket.join(roomId);
    userNames.set(socket.id, userName || 'Guest');
    if (!rooms.has(roomId)) rooms.set(roomId, new Set());
    rooms.get(roomId).add(socket.id);
    if (!roomMeta.has(roomId)) roomMeta.set(roomId, { shareOwner: null, shareName: null });

    socket.to(roomId).emit('peer-joined', { socketId: socket.id, userName });

    const peers = Array.from(rooms.get(roomId))
      .filter(id => id !== socket.id)
      .map(id => ({ id, userName: userNames.get(id) || 'Guest' }));
    socket.emit('current-peers', { peers, share: roomMeta.get(roomId) || { shareOwner: null, shareName: null } });

    broadcastRooms();
  });

  socket.on('get-rooms', () => {
    socket.emit('rooms', { rooms: Array.from(rooms.keys()) });
  });

  socket.on('start-share', ({ roomId, userName }) => {
    if (!roomId) return;
    if (!roomMeta.has(roomId)) roomMeta.set(roomId, { shareOwner: null, shareName: null });
    roomMeta.set(roomId, { shareOwner: socket.id, shareName: userName || 'Guest' });
    io.to(roomId).emit('share-started', { socketId: socket.id, userName: userName || 'Guest' });
  });

  socket.on('stop-share', ({ roomId }) => {
    if (!roomId) return;
    if (!roomMeta.has(roomId)) return;
    const meta = roomMeta.get(roomId);
    if (meta.shareOwner === socket.id) {
      roomMeta.set(roomId, { shareOwner: null, shareName: null });
      io.to(roomId).emit('share-stopped');
    }
  });

  socket.on('signal', ({ to, from, data }) => {
    io.to(to).emit('signal', { from, data });
  });

  socket.on('chat-message', ({ roomId, message, userName, ts }) => {
    io.to(roomId).emit('chat-message', { message, userName, ts });
  });

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (rooms.has(roomId)) {
        rooms.get(roomId).delete(socket.id);
        socket.to(roomId).emit('peer-left', { socketId: socket.id });
        const meta = roomMeta.get(roomId);
        if (meta && meta.shareOwner === socket.id) {
          roomMeta.set(roomId, { shareOwner: null, shareName: null });
          socket.to(roomId).emit('share-stopped');
        }
        if (rooms.get(roomId).size === 0) rooms.delete(roomId);
      }
    }
    userNames.delete(socket.id);
    broadcastRooms();
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log('Signaling server running on', PORT));
