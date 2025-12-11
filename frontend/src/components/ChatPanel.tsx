import React, { useState } from 'react';

interface Message {
  name: string;
  time: string;
  text: string;
  isMe: boolean;
}

interface ChatPanelProps {
  messages: Message[];
  onSend: (msg: string) => void;
}

export default function ChatPanel({
  messages,
  onSend,
}: ChatPanelProps) {
  const [text, setText] = useState('');
  return (
    <div className="chat-panel">
      <div className="messages">
        {messages.map((m, i) => {
          const isSelf = m.isMe;
          return (
            <div key={i} className={`msg-row ${isSelf ? 'msg-self' : 'msg-remote'}`}>
              <div className={`bubble ${isSelf ? 'bubble-self' : 'bubble-remote'}`}>
                <div className="bubble-name">{isSelf ? 'You' : m.name}</div>
                <div className="bubble-text">{m.text}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="input">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Send a message"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSend(text);
              setText('');
            }
          }}
        />
        <button onClick={() => { onSend(text); setText(''); }}>Send</button>
      </div>
    </div>
  );
}

