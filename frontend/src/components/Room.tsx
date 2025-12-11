import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { PeerManager } from '../services/peerManager';
import VideoGrid from './VideoGrid';
import ChatPanel from './ChatPanel';

const SIGNAL_URL = import.meta.env.VITE_SIGNAL_URL || 'http://localhost:4000';

type PeerInfo = { id: string; userName: string };

export default function Room({ roomId, userName, onLeave }: { roomId: string; userName: string; onLeave: () => void }) {
  const [socket] = useState(() => io(SIGNAL_URL));
  const [videoMap, setVideoMap] = useState<Record<string, MediaStream | undefined>>({});
  const [shareMap, setShareMap] = useState<Record<string, MediaStream | undefined>>({});
  const [peerNames, setPeerNames] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<any[]>([]);
  const [pm, setPm] = useState<PeerManager | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [shareOwnerId, setShareOwnerId] = useState<string | null>(null);
  const [shareOwnerName, setShareOwnerName] = useState<string | null>(null);
  const [selfId, setSelfId] = useState<string>('');

  useEffect(() => {
    const pmLocal = new PeerManager(
      (to, data) => socket.emit('signal', { to, from: socket.id, data }),
      (id, stream, isShare) => {
        if (isShare) {
          setShareMap(prev => ({ ...prev, [id]: stream }));
        } else {
          setVideoMap(prev => ({ ...prev, [id]: stream }));
        }
      },
      (id) => {
        setVideoMap(prev => { const c = { ...prev }; delete c[id]; return c; });
        setShareMap(prev => { const c = { ...prev }; delete c[id]; return c; });
      }
    );
    setPm(pmLocal);

    const joinRoom = () => socket.emit('join-room', { roomId, userName });
    if (socket.connected) {
      setSelfId(socket.id);
      joinRoom();
    } else {
      socket.once('connect', () => {
        setSelfId(socket.id);
        joinRoom();
      });
      socket.once('connect', joinRoom);
    }

    pmLocal.initLocalStream().then(stream => {
      setVideoMap(p => ({ ...p, local: stream }));
    }).catch(() => alert('Unable to access camera/microphone'));

    socket.on('current-peers', ({ peers, share }: { peers: PeerInfo[]; share?: { shareOwner: string | null; shareName: string | null } }) => {
      peers.forEach(async ({ id, userName: name }) => {
        setPeerNames(prev => ({ ...prev, [id]: name }));
        try {
          await pmLocal.createOffer(id);
        } catch (e) {
          console.warn('offer failed', e);
        }
      });
      if (share) {
        setShareOwnerId(share.shareOwner || null);
        setShareOwnerName(share.shareName || null);
      }
    });

    socket.on('peer-joined', ({ socketId, userName: name }) => {
      setPeerNames(prev => ({ ...prev, [socketId]: name || 'Guest' }));
      // existing peers should create offer to new peer
      pmLocal.createOffer(socketId).catch((e) => console.warn('offer failed', e));
    });

    socket.on('signal', ({ from, data }) => {
      pmLocal.handleSignal(from, data);
    });

    socket.on('peer-left', ({ socketId }) => {
      setVideoMap(prev => { const c = { ...prev }; delete c[socketId]; return c; });
      setShareMap(prev => { const c = { ...prev }; delete c[socketId]; return c; });
      setPeerNames(prev => { const c = { ...prev }; delete c[socketId]; return c; });
    });

    socket.on('chat-message', (m) => {
      setMessages(prev => [...prev, m]);
    });

    socket.on('share-started', ({ socketId, userName: sharerName }) => {
      // if someone else starts, stop our share
      if (socketId !== socket.id && sharing) {
        pm?.stopScreenShare().catch(() => {});
        setSharing(false);
        setCamOn(true);
        setShareMap(prev => { const c = { ...prev }; delete c['local']; return c; });
      }
      setShareOwnerId(socketId);
      setShareOwnerName(sharerName || 'Guest');
    });

    socket.on('share-stopped', () => {
      if (shareOwnerId === socket.id) {
        setCamOn(true);
      }
      setShareOwnerId(null);
      setShareOwnerName(null);
      setShareMap(prev => { const c = { ...prev }; delete c['local']; delete c[shareOwnerId || '']; return c; });
    });

    return () => {
      try { socket.disconnect(); } catch (e) {}
      pmLocal.peers.forEach((pc) => pc.close());
    };
  }, [roomId, userName, socket]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const msg = { roomId, userName, message: trimmed, ts: Date.now() };
    socket.emit('chat-message', msg);
  };

  const toggleMic = () => {
    const next = !micOn;
    setMicOn(next);
    pm?.setAudioEnabled(next);
  };

  const toggleCam = async () => {
    const next = !camOn;
    try {
      await pm?.setVideoState(next);
      setCamOn(next);
    } catch (e) {
      // if re-acquire fails, revert state
      setCamOn(camOn);
      alert('Unable to toggle camera. Check permissions.');
    }
  };

  const toggleShare = async () => {
    if (!pm) return;
    if (sharing) {
      await pm.stopScreenShare();
      setSharing(false);
      socket.emit('stop-share', { roomId });
      setCamOn(true);
      setShareMap(prev => { const c = { ...prev }; delete c['local']; return c; });
      return;
    }
    try {
      await pm.startScreenShare();
      setSharing(true);
      setCamOn(false);
      if (pm.screenStream) {
        setShareMap(prev => ({ ...prev, local: pm.screenStream! }));
      }
      socket.emit('start-share', { roomId, userName });
    } catch (e) {
      alert('Screen share failed or was cancelled.');
    }
  };

  return (
    <div className="room-root">
      <div className="topbar">
        <div className="meeting-meta">
          <div className="meeting-title">Meeting</div>
          <div className="meeting-room">Room: {roomId}</div>
        </div>
        <div className="control-buttons">
          <button className={micOn ? 'pill' : 'pill pill-off'} onClick={toggleMic}>
            {micOn ? 'Mute mic' : 'Unmute mic'}
          </button>
          <button className={camOn ? 'pill' : 'pill pill-off'} onClick={toggleCam}>
            {camOn ? 'Turn camera off' : 'Turn camera on'}
          </button>
          <button className={sharing ? 'pill pill-share' : 'pill'} onClick={toggleShare}>
            {sharing ? 'Stop sharing' : 'Share screen'}
          </button>
          <button className="pill leave" onClick={() => { onLeave(); }}>Leave</button>
        </div>
        <div className="user-label">
          <div>{userName}</div>
        </div>
      </div>

      <div className="main">
        <div className="stage-area">
          <VideoGrid
            videos={videoMap}
            shares={shareMap}
            peerNames={peerNames}
            localName={userName}
            shareOwnerId={shareOwnerId}
            shareOwnerName={shareOwnerName}
            selfId={selfId}
          />
          <div className="call-controls">
            <div className="control-icon-group">
              <button className={micOn ? 'ctrl ctrl-on' : 'ctrl ctrl-off'} onClick={toggleMic}>Mic</button>
              <button className={camOn ? 'ctrl ctrl-on' : 'ctrl ctrl-off'} onClick={toggleCam}>Cam</button>
              <button className={sharing ? 'ctrl ctrl-share' : 'ctrl ctrl-on'} onClick={toggleShare}>
                {sharing ? 'Stop Share' : 'Share'}
              </button>
            </div>
            <button className="ctrl ctrl-leave" onClick={() => { onLeave(); }}>End Call</button>
          </div>
        </div>

        <ChatPanel messages={messages} onSend={sendMessage} selfName={userName} />
      </div>
    </div>
  );
}

