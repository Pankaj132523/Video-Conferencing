import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const SIGNAL_URL = import.meta.env.VITE_SIGNAL_URL || 'http://localhost:4000';

export default function RoomList({ onJoin, userName }: { onJoin: (id: string) => void; userName: string }) {
  const [newRoom, setNewRoom] = useState('');
  const [rooms, setRooms] = useState<string[]>([]);
  const [socket] = useState(() => io(SIGNAL_URL));

  useEffect(() => {
    socket.emit('get-rooms');
    socket.on('rooms', ({ rooms: list }) => setRooms(list));
    return () => {
      try { socket.disconnect(); } catch (e) {}
    };
  }, [socket]);

  const joinRoom = (id?: string) => {
    const roomId = id || newRoom || Math.random().toString(36).slice(2, 8);
    if (!roomId) return;
    onJoin(roomId);
  };

  return (
    <div className="room-list">
      <h2>Hi {userName}, create or join a room</h2>
      <input placeholder="room-id" value={newRoom} onChange={(e) => setNewRoom(e.target.value)} />
      <button onClick={() => joinRoom()}>{rooms.length ? 'Join / Create' : 'Create room'}</button>

      <div className="room-list-existing">
        <div className="room-list-header">Active rooms</div>
        {rooms.length === 0 && <div className="room-empty">No rooms yet. Create one above.</div>}
        {rooms.map((id) => (
          <button key={id} className="room-pill" onClick={() => joinRoom(id)}>
            {id}
          </button>
        ))}
      </div>
    </div>
  );
}

