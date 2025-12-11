import { FiMic as Mic, FiMicOff as MicOff } from 'react-icons/fi';

interface User {
  id: number;
  name: string;
  initials: string;
  micOn: boolean;
  video: string;
}

interface VideoTileProps {
  user: User;
  isActiveSpeaker: boolean;
}

const VideoTile = ({ user, isActiveSpeaker }: VideoTileProps) => (
  <div className={`relative bg-[#1C1C1C] rounded-xl shadow-lg flex flex-col items-center justify-center p-2
    ${isActiveSpeaker ? 'border-4 border-[#E64242] shadow-[0_0_12px_2px_#E64242]' : 'border border-[rgba(255,255,255,0.12)]'}`}>
    {user.video ? (
      <video src={user.video} autoPlay muted className="rounded-xl w-full h-full object-cover" />
    ) : (
      <div className="w-20 h-20 bg-[#121212] rounded-full flex items-center justify-center">
        <span className="text-2xl text-[#A7A7A7]">{user.initials}</span>
      </div>
    )}
    <div className="absolute bottom-2 left-2 flex items-center gap-2">
      <span className="bg-[#1C1C1C] px-2 py-1 rounded text-xs text-[#F5F5F5]">{user.name}</span>
      {user.micOn ? <Mic size={16} className="text-[#A7A7A7]" /> : <MicOff size={16} className="text-[#E64242]" />}
    </div>
  </div>
);

export default VideoTile;
