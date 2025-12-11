import { Mic, MicOff, Video, VideoOff, ScreenShare, Users, PhoneOff } from 'lucide-react';

interface CallControlsProps {
  micOn: boolean;
  camOn: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onShareScreen: () => void;
  onShowParticipants: () => void;
  onEndCall: () => void;
}

const CallControls = ({ micOn, camOn, onToggleMic, onToggleCam, onShareScreen, onShowParticipants, onEndCall }: CallControlsProps) => (
  <div className="flex items-center justify-center gap-6 py-4">
    <button
      className={`rounded-full p-3 bg-[#1C1C1C] hover:bg-[#E64242]/20 transition shadow-lg ${micOn ? '' : 'border border-[#E64242]'}`}
      onClick={onToggleMic}
    >
      {micOn ? <Mic size={22} className="text-[#F5F5F5]" /> : <MicOff size={22} className="text-[#E64242]" />}
    </button>
    <button
      className={`rounded-full p-3 bg-[#1C1C1C] hover:bg-[#E64242]/20 transition shadow-lg ${camOn ? '' : 'border border-[#E64242]'}`}
      onClick={onToggleCam}
    >
      {camOn ? <Video size={22} className="text-[#F5F5F5]" /> : <VideoOff size={22} className="text-[#E64242]" />}
    </button>
    <button
      className="rounded-full p-3 bg-[#1C1C1C] hover:bg-[#E64242]/20 transition shadow-lg"
      onClick={onShareScreen}
    >
      <ScreenShare size={22} className="text-[#F5F5F5]" />
    </button>
    <button
      className="rounded-full p-3 bg-[#1C1C1C] hover:bg-[#E64242]/20 transition shadow-lg"
      onClick={onShowParticipants}
    >
      <Users size={22} className="text-[#F5F5F5]" />
    </button>
    <button
      className="px-8 py-3 rounded-full bg-[#E64242] text-white font-bold shadow-lg hover:bg-[#c53030] transition"
      onClick={onEndCall}
    >
      <PhoneOff size={22} className="inline mr-2" /> End Call
    </button>
  </div>
);

export default CallControls;
