import { User, Users, Settings, Timer } from 'lucide-react';

interface TopBarProps {
  meetingTitle: string;
  duration: string;
  participants: number;
}

const TopBar = ({ meetingTitle, duration, participants }: TopBarProps) => (
  <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-[rgba(255,255,255,0.12)]">
    <div className="flex items-center gap-3">
      <img src="/logo.svg" alt="Logo" className="h-8" />
      <span className="font-bold text-lg text-[#121212]">{meetingTitle}</span>
    </div>
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-1 text-[#A7A7A7]">
        <Timer size={18} />
        <span>{duration}</span>
      </div>
      <div className="flex items-center gap-1 text-[#121212]">
        <Users size={18} />
        <span>{participants}</span>
      </div>
      <Settings size={22} className="text-[#A7A7A7] cursor-pointer hover:text-[#E64242] transition" />
    </div>
  </div>
);

export default TopBar;
