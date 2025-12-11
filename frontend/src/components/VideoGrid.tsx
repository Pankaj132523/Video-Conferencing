import { useEffect, useRef } from 'react';
import { FiMic as Mic, FiMicOff as MicOff } from 'react-icons/fi';

interface VideoGridProps {
  videos?: Record<string, MediaStream | undefined>;
  shares?: Record<string, MediaStream | undefined>;
  peerNames?: Record<string, string>;
  peerMicStates?: Record<string, boolean>;
  peerCamStates?: Record<string, boolean>;
  localName?: string;
  shareOwnerId?: string | null;
  shareOwnerName?: string | null;
  selfId?: string;
  users?: Array<{
    id: number;
    name: string;
    initials: string;
    micOn: boolean;
    video: string;
  }>;
  activeSpeakerId?: number;
}

const VideoGrid = ({
  videos = {},
  shares = {},
  peerNames = {},
  peerMicStates = {},
  peerCamStates = {},
  localName = 'You',
  shareOwnerId = null,
  shareOwnerName = null,
  selfId = '',
  users,
  activeSpeakerId
}: VideoGridProps) => {
  if (users) {
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-4 w-full h-full p-4">
        {users.map(user => (
          <div
            key={user.id}
            className={`relative bg-[#202124] rounded-lg overflow-hidden flex items-center justify-center aspect-video ${
              user.id === activeSpeakerId ? 'ring-2 ring-[#34A853]' : ''
            }`}
          >
            {user.video ? (
              <video src={user.video} autoPlay muted className="w-full h-full object-cover" />
            ) : (
              <div className="w-24 h-24 bg-[#3C4043] rounded-full flex items-center justify-center">
                <span className="text-3xl text-white font-medium">{user.initials}</span>
              </div>
            )}
            <div className="absolute bottom-2 left-2 flex items-center gap-2">
              <span className="bg-black/60 px-3 py-1 rounded text-sm text-white">{user.name}</span>
              {user.micOn ? (
                <Mic className="text-white" size={16} />
              ) : (
                <MicOff className="text-[#EA4335]" size={16} />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const videoRefs = useRef<Record<string, HTMLVideoElement>>({});
  const shareRefs = useRef<Record<string, HTMLVideoElement>>({});

  useEffect(() => {
    Object.entries(videos).forEach(([id, stream]) => {
      const video = videoRefs.current[id];
      if (video && stream) {
        if (video.srcObject !== stream) {
          video.srcObject = stream;
        }
        const videoTrack = stream.getVideoTracks().find(t => t.readyState === 'live');
        if (videoTrack && videoTrack.enabled) {
          video.play().catch(e => console.warn('Video play failed:', e));
        } else {
          video.pause();
        }
      }
    });
  }, [videos, peerCamStates]);

  useEffect(() => {
    Object.entries(shares).forEach(([id, stream]) => {
      const video = shareRefs.current[id];
      if (video && stream) {
        if (video.srcObject !== stream) {
          video.srcObject = stream;
        }
        video.play().catch(e => console.warn('Share video play failed:', e));
      }
    });
  }, [shares]);

  const allVideoIds = Object.keys(videos).filter(id => {
    if (shareOwnerId && (id === shareOwnerId || (id === 'local' && shareOwnerId === selfId))) {
      return false;
    }
    return true;
  });
  const hasShare = shareOwnerId !== null;
  const shareStream = shareOwnerId 
    ? (shares[shareOwnerId] || (shareOwnerId === selfId ? shares['local'] : null) || 
       (shareOwnerId !== selfId ? videos[shareOwnerId] : null))
    : null;
  
  useEffect(() => {
    if (shareStream && shareOwnerId) {
      const video = shareRefs.current[shareOwnerId];
      if (video && shareStream) {
        if (video.srcObject !== shareStream) {
          video.srcObject = shareStream;
        }
        video.play().catch(e => console.warn('Share video play failed:', e));
      }
    }
  }, [shareStream, shareOwnerId]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getMicState = (id: string) => {
    if (peerMicStates[id] !== undefined) {
      return peerMicStates[id];
    }
    const stream = videos[id];
    if (stream) {
      const audioTrack = stream.getAudioTracks().find(t => t.readyState === 'live');
      return audioTrack ? audioTrack.enabled : true;
    }
    return true;
  };

  const participantCount = allVideoIds.length;

  const getGridLayout = (count: number) => {
    if (count === 0) return 'grid-cols-1';
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 9) return 'grid-cols-3';
    if (count <= 16) return 'grid-cols-4';
    return 'grid-cols-5';
  };

  return (
    <div className="flex-1 w-full h-full p-4 overflow-auto">
      {hasShare && shareStream ? (
        <div className="w-full h-full flex gap-4">
          <div className="flex-1 relative bg-[#000] rounded-lg overflow-hidden border-2 border-[#34a853] shadow-lg min-h-0">
            <video
              ref={el => {
                if (el && shareOwnerId) {
                  shareRefs.current[shareOwnerId] = el;
                  if (shareStream) {
                    if (el.srcObject !== shareStream) {
                      el.srcObject = shareStream;
                    }
                    el.play().catch(e => console.warn('Share video play failed:', e));
                  }
                }
              }}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/70 rounded-md text-sm text-white flex items-center gap-2 backdrop-blur-sm">
              <span className="font-medium">{shareOwnerName || 'Screen Share'}</span>
              <span className="text-xs opacity-75">(sharing)</span>
            </div>
          </div>
          
          {participantCount > 0 && (
            <div className={`w-80 flex-shrink-0 grid ${getGridLayout(participantCount)} gap-3 auto-rows-fr overflow-y-auto`}>
              {allVideoIds.map(id => {
                const name = id === 'local' || id === selfId ? localName : peerNames[id] || 'Guest';
                const stream = videos[id];
                let hasVideo = false;
                if (peerCamStates[id] !== undefined) {
                  hasVideo = peerCamStates[id];
                } else {
                  const videoTrack = stream?.getVideoTracks().find(t => t.readyState === 'live');
                  hasVideo = videoTrack ? videoTrack.enabled : false;
                }
                const micOn = getMicState(id);

                return (
                  <div key={id} className="relative bg-[#3c4043] rounded-lg overflow-hidden border border-[#5f6368] aspect-video flex items-center justify-center">
                    {hasVideo && stream ? (
                      <video
                        ref={el => {
                          if (el) {
                            videoRefs.current[id] = el;
                            if (stream) {
                              if (el.srcObject !== stream) {
                                el.srcObject = stream;
                              }
                              const videoTrack = stream.getVideoTracks().find(t => t.readyState === 'live');
                              if (videoTrack && videoTrack.enabled) {
                                el.play().catch(e => console.warn('Video play failed:', e));
                              } else {
                                el.pause();
                              }
                            }
                          }
                        }}
                        autoPlay
                        playsInline
                        muted={id === 'local' || id === selfId}
                        className="w-full h-full object-cover bg-[#202124]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#202124]">
                        <div className="w-16 h-16 bg-[#3C4043] rounded-full flex items-center justify-center">
                          <span className="text-2xl text-white font-medium">{getInitials(name)}</span>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-white flex items-center gap-1.5 backdrop-blur-sm">
                      <span className="truncate max-w-[100px]">{name}</span>
                      {micOn ? (
                        <Mic size={12} />
                      ) : (
                        <MicOff size={12} className="text-[#EA4335]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className={`w-full h-full grid ${getGridLayout(participantCount)} gap-4 auto-rows-fr`}>
          {allVideoIds.map(id => {
            const name = id === 'local' || id === selfId ? localName : peerNames[id] || 'Guest';
            const stream = videos[id];
            let hasVideo = false;
            if (peerCamStates[id] !== undefined) {
              hasVideo = peerCamStates[id];
            } else {
              const videoTrack = stream?.getVideoTracks().find(t => t.readyState === 'live');
              hasVideo = videoTrack ? videoTrack.enabled : false;
            }
            const micOn = getMicState(id);

            return (
              <div key={id} className="relative bg-[#3c4043] rounded-lg overflow-hidden border border-[#5f6368] aspect-video flex items-center justify-center">
                {hasVideo && stream ? (
                  <video
                    ref={el => {
                      if (el) {
                        videoRefs.current[id] = el;
                        if (stream) {
                          if (el.srcObject !== stream) {
                            el.srcObject = stream;
                          }
                          const videoTrack = stream.getVideoTracks().find(t => t.readyState === 'live');
                          if (videoTrack && videoTrack.enabled) {
                            el.play().catch(e => console.warn('Video play failed:', e));
                          } else {
                            el.pause();
                          }
                        }
                      }
                    }}
                    autoPlay
                    playsInline
                    muted={id === 'local' || id === selfId}
                    className="w-full h-full object-cover bg-[#202124]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#202124]">
                    <div className="w-32 h-32 bg-[#3C4043] rounded-full flex items-center justify-center">
                      <span className="text-4xl text-white font-medium">{getInitials(name)}</span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/70 rounded-md text-sm text-white flex items-center gap-2 backdrop-blur-sm">
                  <span>{name}</span>
                  {micOn ? (
                    <Mic size={14} />
                  ) : (
                    <MicOff size={14} className="text-[#EA4335]" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VideoGrid;
