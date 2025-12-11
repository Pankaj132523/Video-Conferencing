import React, { useState, useEffect, useRef } from 'react';
import { FiSend as Send } from 'react-icons/fi';

interface Message {
  userName?: string;
  name?: string;
  message?: string;
  text?: string;
  ts?: number;
  time?: string;
  isMe?: boolean;
}

interface ChatPanelProps {
  messages: Message[];
  onSend: (msg: string) => void;
  selfName?: string;
}

export default function ChatPanel({
  messages,
  onSend,
  selfName = 'You',
}: ChatPanelProps) {
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (ts?: number) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSend = () => {
    if (text.trim()) {
      onSend(text);
      setText('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#2d2e30] border-l border-[#3c4043] w-80">
      <div className="px-4 py-4 border-b border-[#3c4043]">
        <h3 className="m-0 text-base font-normal text-[#e8eaed]">Chat</h3>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-[#5f6368] scrollbar-track-[#202124]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#9aa0a6] text-center">
            <p className="m-1 text-sm">No messages yet</p>
            <p className="m-1 text-xs opacity-70">Start the conversation!</p>
          </div>
        ) : (
          messages.map((m, i) => {
            const userName = m.userName || m.name || 'Guest';
            const messageText = m.message || m.text || '';
            const isSelf = userName === selfName || m.isMe;
            const time = m.time || formatTime(m.ts);

            return (
              <div key={i} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-3 py-2 rounded-lg break-words ${
                  isSelf 
                    ? 'bg-[#1a73e8] text-white' 
                    : 'bg-[#303134] text-[#e8eaed] border border-[#3c4043]'
                }`}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-xs font-medium ${isSelf ? 'opacity-90' : 'opacity-90'}`}>
                      {isSelf ? 'You' : userName}
                    </span>
                    {time && <span className="text-[11px] opacity-70">{time}</span>}
                  </div>
                  <div className="text-sm leading-relaxed">{messageText}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-2 p-4 border-t border-[#3c4043] bg-[#2d2e30]">
        <input
          className="flex-1 px-3 py-2.5 rounded-full border border-[#5f6368] bg-[#303134] text-[#e8eaed] text-sm focus:outline-none focus:border-[#8ab4f8] focus:ring-2 focus:ring-[#8ab4f8]/20 placeholder:text-[#9aa0a6]"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Send a message"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button 
          onClick={handleSend} 
          className="bg-[#1a73e8] border-none rounded-full w-10 h-10 flex items-center justify-center text-white cursor-pointer transition-colors hover:bg-[#1765cc] active:bg-[#1557b0] flex-shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
