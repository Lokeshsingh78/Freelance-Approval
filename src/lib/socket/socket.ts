import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    const URL =
      import.meta.env.VITE_API_BASE_URL ||
      (import.meta.env.DEV ? "http://localhost:8080" : "https://freelance-approval.onrender.com");
    socket = io(URL, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
};
