## Packages
simple-peer | WebRTC wrapper for easy peer-to-peer connection handling
socket.io-client | Real-time signaling for WebRTC
framer-motion | Smooth animations for UI transitions
lucide-react | Beautiful icons
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility for merging Tailwind CSS classes

## Notes
Socket.io connects to the same host as the frontend (relative path).
Video calling requires `simple-peer` which needs a global `global` variable in Vite (might need a polyfill or specific vite config, but usually works with modern bundlers if handled correctly. If strict mode issues arise, standard RTCPeerConnection is a backup, but simple-peer is requested).
The app uses a dark/light theme, defaulting to a rich dark mode for video calls.
