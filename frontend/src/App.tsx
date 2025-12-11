import React, { useState } from 'react';
import RoomList from './components/RoomList';
import Room from './components/Room';

export default function App() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');

  if (!userName) {
    return (
      <div className="app-root">
        <div className="room-list">
          <h2>Enter your name</h2>
          <input
            placeholder="Your name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
          />
          <button onClick={() => setUserName(nameInput.trim() || 'Guest')}>Continue</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root">
      {!roomId ? (
        <RoomList onJoin={(id) => setRoomId(id)} userName={userName} />
      ) : (
        <Room roomId={roomId} userName={userName} onLeave={() => setRoomId(null)} />
      )}
    </div>
  );
}

