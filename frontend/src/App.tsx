import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import RoomList from './components/RoomList';
import Room from './components/Room';

function NameEntry({ onContinue }: { onContinue: (name: string) => void }) {
  const [nameInput, setNameInput] = useState<string>('');

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[#202124]">
      <div className="w-full max-w-md bg-[#2d2e30] border border-[#3c4043] rounded-lg p-8 shadow-lg">
        <h2 className="m-0 mb-6 text-[#e8eaed] text-2xl font-normal">Enter your name to continue</h2>
        <input
          className="w-full px-4 py-3 mb-4 rounded border border-[#5f6368] bg-[#303134] text-[#e8eaed] text-sm focus:outline-none focus:border-[#8ab4f8] focus:ring-2 focus:ring-[#8ab4f8]/20"
          placeholder="Your name"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const name = nameInput.trim() || 'Guest';
              localStorage.setItem('userName', name);
              onContinue(name);
            }
          }}
        />
        <button 
          className="w-full px-6 py-2.5 rounded bg-[#1a73e8] text-white font-medium text-sm cursor-pointer transition-colors hover:bg-[#1765cc]"
          onClick={() => {
            const name = nameInput.trim() || 'Guest';
            localStorage.setItem('userName', name);
            onContinue(name);
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function RoomListPage() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const savedName = localStorage.getItem('userName');
    if (savedName) {
      setUserName(savedName);
    }
  }, []);

  if (!userName) {
    return <NameEntry onContinue={(name) => {
      setUserName(name);
      localStorage.setItem('userName', name);
    }} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[#202124]">
      <RoomList 
        onJoin={(id) => navigate(`/meeting/${id}`)} 
        userName={userName} 
      />
    </div>
  );
}

function MeetingPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const savedName = localStorage.getItem('userName');
    if (savedName) {
      setUserName(savedName);
    } else {
      navigate('/');
    }
  }, [navigate]);

  if (!userName || !roomId) {
    return null;
  }

  return (
    <div className="w-full h-screen bg-[#202124] flex flex-col">
      <Room 
        roomId={roomId} 
        userName={userName} 
        onLeave={() => navigate('/')} 
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/video-conference">
      <Routes>
        <Route path="/" element={<RoomListPage />} />
        <Route path="/meeting/:roomId" element={<MeetingPage />} />
      </Routes>
    </BrowserRouter>
  );
}