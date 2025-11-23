// Socket client for collaborative rooms, presence, and room messages
// Uses socket.io-client to connect to the local Node server.

import { io } from "socket.io-client";

let socket = null;
let cachedUser = null;

export function getSocket(currentUser) {
  // Cache the latest user for join/leave presence events
  cachedUser = currentUser || cachedUser;

  if (socket) return socket;

  // Connect to the backend server (PORT 3000). CORS is allowed in server.js
  socket = io("http://localhost:3000", {
    transports: ["websocket"],
    withCredentials: true,
    query: {
      userId: (cachedUser && cachedUser.id) || undefined,
      name: (cachedUser && cachedUser.name) || undefined,
    },
  });

  return socket;
}

export function joinRoom(roomId) {
  if (!socket) return;
  socket.emit("join_room", { roomId });
}

export function leaveRoom(roomId) {
  if (!socket) return;
  socket.emit("leave_room", { roomId });
}

export function sendRoomMessage({ roomId, content, history = [], model }) {
  if (!socket) return;
  socket.emit("user_message", { roomId, content, history, model });
}

export function onPresence(cb) {
  if (!socket) return () => {};
  const handler = (payload) => cb(payload);
  socket.on("presence", handler);
  return () => socket.off("presence", handler);
}

export function onRoomMessage(cb) {
  if (!socket) return () => {};
  const handler = (msg) => cb(msg);
  socket.on("message", handler);
  return () => socket.off("message", handler);
}