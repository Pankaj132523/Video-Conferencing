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
      const isShare = label.includes('screen') || label.includes('display');
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
      const alreadyExists = pc.getSenders().some(s => s.track && s.track.id === this.screenTrack.id);
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
      return;
    }
    let track = existingVideo[0];
    if (!track) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      track = stream.getVideoTracks()[0];
      if (!track) return;
      this.localStream.getVideoTracks().forEach(t => this.localStream!.removeTrack(t));
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
        pc.addTrack(track, this.localStream);
      }
    }
  }
  async startScreenShare() {
    await this.ensureLocalStream();
    const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    const screenTrack = displayStream.getVideoTracks()[0];
    if (!screenTrack || !this.localStream) return;
    this.screenTrack = screenTrack;
    this.screenStream = displayStream;
    const currentCam = this.localStream.getVideoTracks()[0];
    if (currentCam) this.originalCamTrack = currentCam;
    for (const pc of this.peers.values()) {
      const sender = pc.addTrack(screenTrack, displayStream);
      this.screenSenders.set(sender.track?.id || Math.random().toString(), sender);
    }
    this.screenStream = displayStream;
    screenTrack.onended = () => {
      this.stopScreenShare();
    };
  }
  async stopScreenShare() {
    if (!this.localStream) return;
    if (this.screenTrack) {
      try { this.screenTrack.stop(); } catch {}
      this.screenTrack = null;
    }
    for (const pc of this.peers.values()) {
      const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video' && s.track.label.toLowerCase().includes('screen'));
      if (sender) {
        try { pc.removeTrack(sender); } catch {}
      }
    }
    this.screenSenders.clear();
    this.screenStream = null;
    if (!this.originalCamTrack || this.originalCamTrack.readyState !== 'live') {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.originalCamTrack = stream.getVideoTracks()[0] || null;
    }
    const cam = this.originalCamTrack;
    if (!cam) return;
    this.localStream.getVideoTracks().forEach(t => this.localStream!.removeTrack(t));
    this.localStream.addTrack(cam);
    await this._replaceVideoTrack(cam);
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

