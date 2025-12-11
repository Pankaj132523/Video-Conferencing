import TopBar from '../components/TopBar';
import VideoGrid from '../components/VideoGrid';
import ChatPanel from '../components/ChatPanel';
import CallControls from '../components/CallControls';
import { useState } from 'react';

const MeetingPage = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const handleSend = (msg: string) => {
    setMessages([...messages, { name: 'Me', time: 'Now', text: msg, isMe: true }]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar meetingTitle="Team Sync" duration="12:34" participants={0} />
      <div className="flex flex-1 gap-6 px-8 py-6">
        <div className="flex-1 flex items-center justify-center">
          <VideoGrid users={[]} activeSpeakerId={0} />
        </div>
        <div className="w-[350px] flex flex-col h-full">
          <ChatPanel messages={messages} onSend={handleSend} />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full flex justify-center">
        <CallControls
          micOn={micOn}
          camOn={camOn}
          onToggleMic={() => setMicOn(!micOn)}
          onToggleCam={() => setCamOn(!camOn)}
          onShareScreen={() => {}}
          onShowParticipants={() => {}}
          onEndCall={() => {}}
        />
      </div>
    </div>
  );
};

export default MeetingPage;
