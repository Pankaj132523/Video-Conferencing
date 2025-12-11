import { Smile, Send } from 'lucide-react';
import { useState } from 'react';

interface ChatInputProps {
  onSend: (msg: string) => void;
}

const ChatInput = ({ onSend }: ChatInputProps) => {
  const [value, setValue] = useState('');
  return (
    <div className="flex items-center px-4 py-3 border-t border-[rgba(255,255,255,0.12)]">
      <button className="mr-2 text-[#A7A7A7] hover:text-[#E64242] transition">
        <Smile size={22} />
      </button>
      <input
        className="flex-1 bg-[#1C1C1C] text-[#F5F5F5] px-3 py-2 rounded-xl outline-none"
        placeholder="Type a message..."
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && value && (onSend(value), setValue(''))}
      />
      <button
        className="ml-2 bg-[#E64242] text-white px-4 py-2 rounded-xl hover:bg-[#c53030] transition"
        onClick={() => { if (value) { onSend(value); setValue(''); } }}
      >
        <Send size={18} />
      </button>
    </div>
  );
};

export default ChatInput;
