export type SignalPayload = { from: string; data: any };
const STUN = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
export class PeerManager {
  localStream: MediaStream | null = null;
  screenStream: MediaStream | null = null;
  peers: Map<string, RTCPeerConnection> = new Map();
  onTrack: (id: string, stream: MediaStream, isShare: boolean) => void;
  onRemove: (id: string) => void;
  sendSignal: (to: string, data: any) => void;
  private localReady: Promise<MediaStream>;
  private resolveLocalReady!: (s: MediaStream) => void;
  private originalCamTrack: MediaStreamTrack | null = null;
  private screenTrack: MediaStreamTrack | null = null;
  private screenSenders: Map<string, RTCRtpSender> = new Map();
  constructor(
    sendSignal: (to: string, data: any) => void,
    onTrack: (id: string, stream: MediaStream, isShare: boolean) => void,
    onRemove: (id: string) => void
  ) {
    this.sendSignal = sendSignal;
    this.onTrack = onTrack;
    this.onRemove = onRemove;
    this.localReady = new Promise((resolve) => { this.resolveLocalReady = resolve; });
  }
  async initLocalStream() {
    this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const vid = this.localStream.getVideoTracks()[0] || null;
    this.originalCamTrack = vid;
    this.resolveLocalReady(this.localStream);
    return this.localStream;
  }
  private async ensureLocalStream() {
    if (this.localStream) return this.localStream;
    return this.localReady;
  }
  async createOffer(peerId: string) {
    await this.ensureLocalStream();
    const pc = this._createPeerConnection(peerId);
    this._attachLocalTracks(pc);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    this.sendSignal(peerId, { type: 'offer', sdp: pc.localDescription });
  }
  async handleSignal(from: string, data: any) {
    if (data.type === 'offer') {
      await this.ensureLocalStream();
      const pc = this._createPeerConnection(from);
      this._attachLocalTracks(pc);
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const ans = await pc.createAnswer();
      await pc.setLocalDescription(ans);
      this.sendSignal(from, { type: 'answer', sdp: pc.localDescription });
    } else if (data.type === 'answer') {
      const pc = this.peers.get(from);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
    } else if (data.type === 'candidate') {
      const pc = this.peers.get(from);
      if (pc) pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  }
  _createPeerConnection(id: string) {
    if (this.peers.has(id)) return this.peers.get(id)!;
    const pc = new RTCPeerConnection(STUN);
    pc.onicecandidate = (ev) => {
      if (ev.candidate) this.sendSignal(id, { type: 'candidate', candidate: ev.candidate });
    };
    pc.ontrack = (ev) => {
      const stream = ev.streams[0];
      const label = ev.track.label?.toLowerCase() || '';
      const kind = ev.track.kind;
      const isShare = label.includes('screen') || label.includes('display') || label.includes('monitor') || 
                      (kind === 'video' && (ev.track.getSettings().displaySurface !== undefined));
      this.onTrack(id, stream, isShare);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this._cleanupPeer(id);
      }
    };
    this.peers.set(id, pc);
    return pc;
  }
  _attachLocalTracks(pc: RTCPeerConnection) {
    if (!this.localStream) return;
    for (const t of this.localStream.getTracks()) {
      const alreadyExists = pc.getSenders().some(s => s.track && s.track.id === t.id);
      if (!alreadyExists) {
        pc.addTrack(t, this.localStream);
      }
    }
    if (this.screenTrack && this.screenStream) {
      const alreadyExists = pc.getSenders().some(s => s.track && s.track.id === this.screenTrack!.id);
      if (!alreadyExists) {
        const sender = pc.addTrack(this.screenTrack, this.screenStream);
        this.screenSenders.set(pc.connectionState + Math.random(), sender);
      }
    }
  }
  setAudioEnabled(enabled: boolean) {
    if (!this.localStream) return;
    this.localStream.getAudioTracks().forEach(t => { t.enabled = enabled; });
  }
  async setVideoState(enabled: boolean) {
    if (!this.localStream) return;
    const existingVideo = this.localStream.getVideoTracks().filter(t => t.readyState === 'live');
    if (!enabled) {
      existingVideo.forEach(t => { t.enabled = false; });
      for (const pc of this.peers.values()) {
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video' && !s.track.label.toLowerCase().includes('screen'));
        if (sender && existingVideo[0]) {
          await sender.replaceTrack(existingVideo[0]);
        }
      }
      return;
    }
    let track = existingVideo[0];
    if (!track || track.readyState !== 'live') {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      track = stream.getVideoTracks()[0];
      if (!track) return;
      this.localStream.getVideoTracks().forEach(t => {
        if (t.kind === 'video') {
          this.localStream!.removeTrack(t);
          t.stop();
        }
      });
      this.localStream.addTrack(track);
    } else {
      track.enabled = true;
    }
    await this._replaceVideoTrack(track);
  }
  private async _replaceVideoTrack(track: MediaStreamTrack) {
    for (const pc of this.peers.values()) {
      const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender) {
        await sender.replaceTrack(track);
      } else {
        if (this.localStream) {
          pc.addTrack(track, this.localStream);
        }
      }
    }
  }
  async startScreenShare() {
    await this.ensureLocalStream();
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenTrack = displayStream.getVideoTracks()[0];
      if (!screenTrack || !this.localStream) return;
      
      this.screenTrack = screenTrack;
      this.screenStream = displayStream;
      
      const currentCam = this.localStream.getVideoTracks().find(t => t.kind === 'video' && !t.label.toLowerCase().includes('screen'));
      if (currentCam) {
        this.originalCamTrack = currentCam;
        currentCam.enabled = false;
      }
      
      for (const pc of this.peers.values()) {
        const videoSender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
          this.screenSenders.set(pc.connectionState + Math.random().toString(), videoSender);
        } else {
          const sender = pc.addTrack(screenTrack, displayStream);
          this.screenSenders.set(sender.track?.id || Math.random().toString(), sender);
        }
      }
      
      screenTrack.onended = () => {
        this.stopScreenShare();
      };
    } catch (error) {
      console.error('Screen share error:', error);
      throw error;
    }
  }
  async stopScreenShare() {
    if (!this.localStream) return;
    
    if (this.screenTrack) {
      try { 
        this.screenTrack.stop(); 
      } catch (e) {
        console.warn('Error stopping screen track:', e);
      }
      this.screenTrack = null;
    }
    
    let camTrack = this.originalCamTrack;
    if (!camTrack || camTrack.readyState !== 'live') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        camTrack = stream.getVideoTracks()[0] || null;
        if (camTrack) {
          this.originalCamTrack = camTrack;
          const existingVideo = this.localStream.getVideoTracks().find(t => t.kind === 'video');
          if (existingVideo) {
            this.localStream.removeTrack(existingVideo);
          }
          this.localStream.addTrack(camTrack);
        }
      } catch (error) {
        console.error('Error getting camera:', error);
      }
    } else {
      camTrack.enabled = true;
      const existingVideo = this.localStream.getVideoTracks().find(t => t.kind === 'video');
      if (!existingVideo || existingVideo.id !== camTrack.id) {
        if (existingVideo) {
          this.localStream.removeTrack(existingVideo);
        }
        this.localStream.addTrack(camTrack);
      }
    }
    
    if (camTrack) {
      for (const pc of this.peers.values()) {
        const videoSender = pc.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (videoSender) {
          try {
            await videoSender.replaceTrack(camTrack);
          } catch (error) {
            console.error('Error replacing track with camera:', error);
            try {
              pc.removeTrack(videoSender);
              pc.addTrack(camTrack, this.localStream!);
            } catch (e) {
              console.error('Error in fallback track replacement:', e);
            }
          }
        } else {
          try {
            pc.addTrack(camTrack, this.localStream!);
          } catch (e) {
            console.error('Error adding camera track:', e);
          }
        }
      }
    }
    
    this.screenSenders.clear();
    this.screenStream = null;
  }
  _cleanupPeer(id: string) {
    const pc = this.peers.get(id);
    if (pc) {
      try { pc.close(); } catch (e) {}
    }
    this.peers.delete(id);
    this.onRemove(id);
  }
}
