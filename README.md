# Video Conferencing + Chat (React + WebRTC + Socket.IO)

A minimal scaffold for a personal video conferencing + chat app. Frontend is Vite + React + TypeScript; backend is Express + Socket.IO for signaling. Docker-compose builds both and an optional NGINX reverse proxy config is provided.

## Structure

- `backend/` — Express + Socket.IO signaling server
- `frontend/` — Vite + React client
- `docker-compose.yml` — build/run both services
- `frontend/nginx.conf` — prod static + proxy sample

## Dev setup

Backend:
```bash
cd backend
npm install
npm start
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Set `VITE_SIGNAL_URL` in a `.env` file at `frontend/` if your signaling host differs (defaults to `http://localhost:4000`).

## Docker Compose

```bash
docker compose up --build
```

Frontend: `http://localhost:3000`  
Backend (signaling): `http://localhost:4000`

## Notes

- STUN: `stun:stun.l.google.com:19302`
- Peer mesh: suitable for small groups; add TURN for wider NAT traversal.

