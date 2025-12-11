import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { PeerManager } from '../services/peerManager';
import VideoGrid from './VideoGrid';
import ChatPanel from './ChatPanel';
import CallControls from './CallControls';
import TopBar from './TopBar';

type PeerInfo = { id: string; userName: string };

export default function Room({ roomId, userName, onLeave }: { roomId: string; userName: string; onLeave: () => void }) {
  const [socket] = useState(() => io('/video-conference-socket.io', {
    path: '/video-conference-socket.io'
  }));
  const [videoMap, setVideoMap] = useState<Record<string, MediaStream | undefined>>({});
  const [shareMap, setShareMap] = useState<Record<string, MediaStream | undefined>>({});
  const [peerNames, setPeerNames] = useState<Record<string, string>>({});
  const [peerMicStates, setPeerMicStates] = useState<Record<string, boolean>>({});
  const [peerCamStates, setPeerCamStates] = useState<Record<string, boolean>>({});
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
          console.log('Screen share received from:', id, stream);
          setShareMap(prev => ({ ...prev, [id]: stream }));
          setVideoMap(prev => {
            const updated = { ...prev };
            delete updated[id];
            return updated;
          });
        } else {
          setVideoMap(prev => ({ ...prev, [id]: stream }));
          setShareMap(prev => {
            const updated = { ...prev };
            delete updated[id];
            return updated;
          });
          const audioTrack = stream.getAudioTracks().find(t => t.readyState === 'live');
          const videoTrack = stream.getVideoTracks().find(t => t.readyState === 'live');
          if (audioTrack) {
            setPeerMicStates(p => ({ ...p, [id]: audioTrack.enabled }));
            audioTrack.onmute = () => setPeerMicStates(p => ({ ...p, [id]: false }));
            audioTrack.onunmute = () => setPeerMicStates(p => ({ ...p, [id]: true }));
          }
          if (videoTrack) {
            setPeerCamStates(p => ({ ...p, [id]: videoTrack.enabled }));
            videoTrack.onended = () => setPeerCamStates(p => ({ ...p, [id]: false }));
            const checkVideoState = () => {
              setPeerCamStates(p => ({ ...p, [id]: videoTrack.enabled }));
            };
            const interval = setInterval(() => {
              if (videoTrack.readyState === 'live') {
                checkVideoState();
              } else {
                clearInterval(interval);
              }
            }, 500);
          }
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
      setSelfId(socket.id ?? '');
      joinRoom();
    } else {
      socket.once('connect', () => {
        setSelfId(socket.id ?? '');
        joinRoom();
      });
    }

    pmLocal.initLocalStream().then(stream => {
      setVideoMap(p => ({ ...p, local: stream }));
      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];
      if (audioTrack) {
        setPeerMicStates(p => ({ ...p, local: audioTrack.enabled }));
      }
      if (videoTrack) {
        setPeerCamStates(p => ({ ...p, local: videoTrack.enabled }));
      }
      stream.getTracks().forEach(track => {
        track.onended = () => {
          if (track.kind === 'video') {
            setPeerCamStates(p => ({ ...p, local: false }));
          }
        };
      });
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
    setPeerMicStates(p => ({ ...p, local: next }));
  };

  const toggleCam = async () => {
    const next = !camOn;
    try {
      await pm?.setVideoState(next);
      setCamOn(next);
      setPeerCamStates(p => ({ ...p, local: next }));
      if (pm?.localStream) {
        setVideoMap(prev => {
          const updated = { ...prev };
          updated.local = pm.localStream!;
          return updated;
        });
        setTimeout(() => {
          setVideoMap(prev => ({ ...prev }));
        }, 100);
      }
    } catch (e) {
      setCamOn(camOn);
      alert('Unable to toggle camera. Check permissions.');
    }
  };

  const toggleShare = async () => {
    if (!pm) return;
    if (sharing) {
      try {
        await pm.stopScreenShare();
        setSharing(false);
        socket.emit('stop-share', { roomId });
        setCamOn(true);
        setShareMap(prev => { const c = { ...prev }; delete c['local']; return c; });
        if (pm.localStream) {
          setVideoMap(prev => ({ ...prev, local: pm.localStream! }));
        }
      } catch (e) {
        console.error('Error stopping screen share:', e);
      }
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
      console.error('Screen share error:', e);
      if (e instanceof Error && e.name !== 'NotAllowedError' && e.name !== 'AbortError') {
        alert('Screen share failed. Please try again.');
      }
      setSharing(false);
      setCamOn(true);
    }
  };

  const participantCount = Object.keys(peerNames).length + 1;

  return (
    <div className="w-full h-screen flex flex-col bg-[#202124]">
      <TopBar roomId={roomId} userName={userName} participants={participantCount} />

      <div className="flex flex-1 gap-0 overflow-hidden">
        <div className="flex-1 flex flex-col bg-[#202124] relative min-w-0">
          <VideoGrid
            videos={videoMap}
            shares={shareMap}
            peerNames={peerNames}
            peerMicStates={peerMicStates}
            peerCamStates={peerCamStates}
            localName={userName}
            shareOwnerId={shareOwnerId}
            shareOwnerName={shareOwnerName}
            selfId={selfId}
          />
          <CallControls
            micOn={micOn}
            camOn={camOn}
            onToggleMic={toggleMic}
            onToggleCam={toggleCam}
            onShareScreen={toggleShare}
            onShowParticipants={() => {}}
            onEndCall={onLeave}
            sharing={sharing}
          />
        </div>

        <ChatPanel messages={messages} onSend={sendMessage} selfName={userName} />
      </div>
    </div>
  );
}
