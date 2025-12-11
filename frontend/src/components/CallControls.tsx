import { FiMic as Mic, FiMicOff as MicOff, FiVideo as Video, FiVideoOff as VideoOff, FiMonitor as Monitor, FiUsers as Users, FiPhone as Phone } from 'react-icons/fi';

interface CallControlsProps {
  micOn: boolean;
  camOn: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onShareScreen: () => void;
  onShowParticipants: () => void;
  onEndCall: () => void;
  sharing?: boolean;
}

const CallControls = ({
  micOn,
  camOn,
  onToggleMic,
  onToggleCam,
  onShareScreen,
  onShowParticipants,
  onEndCall,
  sharing = false
}: CallControlsProps) => (
  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
    <div className="flex items-center gap-2 bg-[#303134] p-2 rounded-full shadow-lg">
      <button
        className={`w-12 h-12 rounded-full border-none flex items-center justify-center cursor-pointer transition-all text-[#e8eaed] ${
          micOn 
            ? 'bg-[#5f6368] hover:bg-[#80868b]' 
            : 'bg-[#ea4335] hover:bg-[#d33b2c] text-white'
        }`}
        onClick={onToggleMic}
        title={micOn ? 'Mute microphone' : 'Unmute microphone'}
      >
        {micOn ? <Mic size={20} /> : <MicOff size={20} />}
      </button>
      <button
        className={`w-12 h-12 rounded-full border-none flex items-center justify-center cursor-pointer transition-all text-[#e8eaed] ${
          camOn 
            ? 'bg-[#5f6368] hover:bg-[#80868b]' 
            : 'bg-[#ea4335] hover:bg-[#d33b2c] text-white'
        }`}
        onClick={onToggleCam}
        title={camOn ? 'Turn off camera' : 'Turn on camera'}
      >
        {camOn ? <Video size={20} /> : <VideoOff size={20} />}
      </button>
      <button
        className={`w-12 h-12 rounded-full border-none flex items-center justify-center cursor-pointer transition-all text-[#e8eaed] ${
          sharing 
            ? 'bg-[#34a853] hover:bg-[#2d8e47] text-white' 
            : 'bg-[#5f6368] hover:bg-[#80868b]'
        }`}
        onClick={onShareScreen}
        title={sharing ? 'Stop sharing' : 'Share screen'}
      >
        <Monitor size={20} />
      </button>
      <button
        className="w-12 h-12 rounded-full border-none flex items-center justify-center cursor-pointer transition-all bg-[#5f6368] hover:bg-[#80868b] text-[#e8eaed]"
        onClick={onShowParticipants}
        title="Show participants"
      >
        <Users size={20} />
      </button>
      <button
        className="w-12 h-12 rounded-full border-none flex items-center justify-center cursor-pointer transition-all bg-[#ea4335] hover:bg-[#d33b2c] text-white ml-2"
        onClick={onEndCall}
        title="Leave call"
      >
        <Phone size={20} />
      </button>
    </div>
  </div>
);

export default CallControls;
