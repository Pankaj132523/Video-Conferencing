import io from 'socket.io-client';

/**
 * Socket.io client instance configured for NGINX reverse proxy + Tailscale deployment.
 * 
 * Configuration:
 * - Uses relative connection (io("/")) to work with any domain/port
 * - Path matches NGINX location block: /video-conference-socket.io
 * - Supports both websocket and polling transports for maximum compatibility
 * - Works behind reverse proxy without hardcoded URLs
 */
export const socket = io("/", {
  path: "/video-conference-socket.io",
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: Infinity,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  forceNew: false,
  upgrade: true,
  rememberUpgrade: true,
  autoConnect: true,
});

// Add connection event listeners for debugging
socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Socket disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

socket.on('reconnect', (attemptNumber) => {
  console.log('Socket reconnected after', attemptNumber, 'attempts');
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('Socket reconnection attempt:', attemptNumber);
});

socket.on('reconnect_error', (error) => {
  console.error('Socket reconnection error:', error);
});

socket.on('reconnect_failed', () => {
  console.error('Socket reconnection failed');
});

