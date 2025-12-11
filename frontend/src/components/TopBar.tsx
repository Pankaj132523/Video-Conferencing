import { FiClock as Clock, FiUsers as Users, FiSettings as Settings, FiShare2 as Share } from 'react-icons/fi';
import { useState } from 'react';

interface TopBarProps {
  meetingTitle?: string;
  duration?: string;
  participants?: number;
  roomId?: string;
  userName?: string;
}

const TopBar = ({ meetingTitle, duration, participants, roomId, userName }: TopBarProps) => {
  const [copied, setCopied] = useState(false);

  const copyMeetingLink = () => {
    if (!roomId) return;
    const meetingUrl = `${window.location.origin}/meeting/${roomId}`;
    navigator.clipboard.writeText(meetingUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      const textArea = document.createElement('textarea');
      textArea.value = meetingUrl;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error('Fallback copy failed:', e);
      }
      document.body.removeChild(textArea);
    });
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-[#1f1f1f] border-b border-[#3c4043] min-h-[64px]">
      <div className="flex items-center flex-1">
        <div className="flex flex-col gap-0.5">
          <div className="text-[#e8eaed] text-sm font-normal">{meetingTitle || 'Meeting'}</div>
          {roomId && <div className="text-[#9aa0a6] text-xs">Room: {roomId}</div>}
        </div>
      </div>
      <div className="flex items-center gap-4 flex-1 justify-center">
        {duration && (
          <div className="flex items-center gap-1.5 text-[#e8eaed] text-sm">
            <Clock size={16} />
            <span>{duration}</span>
          </div>
        )}
        {participants !== undefined && (
          <div className="flex items-center gap-1.5 text-[#e8eaed] text-sm">
            <Users size={16} />
            <span>{participants}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 flex-1 justify-end">
        {roomId && (
          <button 
            className="relative p-2 rounded-full hover:bg-[#3c4043] transition-colors text-[#e8eaed]"
            onClick={copyMeetingLink}
            title={copied ? 'Link copied!' : 'Copy meeting link'}
          >
            <Share size={18} />
            {copied && (
              <span className="absolute -top-8 right-0 bg-[#34a853] text-white px-2 py-1 rounded text-xs whitespace-nowrap animate-pulse">
                Copied!
              </span>
            )}
          </button>
        )}
        {userName && <div className="text-[#e8eaed] text-sm font-medium">{userName}</div>}
        <button className="p-2 rounded-full hover:bg-[#3c4043] transition-colors text-[#e8eaed]" title="Settings">
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
};

export default TopBar;
