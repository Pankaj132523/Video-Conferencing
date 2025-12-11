import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { FiCopy as Copy, FiCheck as Check } from 'react-icons/fi';

const SIGNAL_URL = import.meta.env.VITE_SIGNAL_URL || 'http://localhost:4000';

export default function RoomList({ onJoin, userName }: { onJoin: (id: string) => void; userName: string }) {
  const [newRoom, setNewRoom] = useState('');
  const [rooms, setRooms] = useState<string[]>([]);
  const [socket] = useState(() => io(SIGNAL_URL));
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);
  const navigate = useNavigate();

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
    navigate(`/meeting/${roomId}`);
  };

  const copyRoomLink = (roomId: string) => {
    const meetingUrl = `${window.location.origin}/meeting/${roomId}`;
    navigator.clipboard.writeText(meetingUrl).then(() => {
      setCopiedRoomId(roomId);
      setTimeout(() => setCopiedRoomId(null), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      const textArea = document.createElement('textarea');
      textArea.value = meetingUrl;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedRoomId(roomId);
        setTimeout(() => setCopiedRoomId(null), 2000);
      } catch (e) {
        console.error('Fallback copy failed:', e);
      }
      document.body.removeChild(textArea);
    });
  };

  return (
    <div className="w-full max-w-md bg-[#2d2e30] border border-[#3c4043] rounded-lg p-8 shadow-lg">
      <h2 className="m-0 mb-6 text-[#e8eaed] text-2xl font-normal">Hi {userName}, create or join a meeting</h2>
      <div className="flex gap-2 mb-4">
        <input 
          className="flex-1 px-4 py-3 rounded border border-[#5f6368] bg-[#303134] text-[#e8eaed] text-sm focus:outline-none focus:border-[#8ab4f8] focus:ring-2 focus:ring-[#8ab4f8]/20"
          placeholder="Enter room ID or leave empty to create new" 
          value={newRoom} 
          onChange={(e) => setNewRoom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              joinRoom();
            }
          }}
        />
        <button 
          className="px-6 py-3 rounded bg-[#1a73e8] text-white font-medium text-sm cursor-pointer transition-colors hover:bg-[#1765cc] whitespace-nowrap"
          onClick={() => joinRoom()}
        >
          {rooms.length ? 'Join / Create' : 'Create Meeting'}
        </button>
      </div>

      <div className="mt-6 pt-6 border-t border-[#3c4043]">
        <div className="w-full font-medium text-[#9aa0a6] text-sm mb-2">Active meetings</div>
        {rooms.length === 0 && (
          <div className="text-[#9aa0a6] text-sm">No active meetings. Create one above.</div>
        )}
        <div className="flex flex-wrap gap-2">
          {rooms.map((id) => (
            <div key={id} className="flex items-center gap-2">
              <button 
                className="bg-[#303134] text-[#e8eaed] border border-[#5f6368] px-4 py-2 rounded-full text-sm cursor-pointer transition-colors hover:bg-[#3c4043]"
                onClick={() => joinRoom(id)}
              >
                {id}
              </button>
              <button
                className="bg-transparent border border-[#5f6368] text-[#e8eaed] p-1.5 rounded cursor-pointer transition-colors hover:bg-[#3c4043] hover:border-[#8ab4f8] flex items-center justify-center"
                onClick={() => copyRoomLink(id)}
                title={copiedRoomId === id ? 'Link copied!' : 'Copy meeting link'}
              >
                {copiedRoomId === id ? (
                  <Check size={16} className="text-green-400" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
