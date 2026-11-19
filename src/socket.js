
import { io } from "socket.io-client";
import API_URL from "./api";

const socket = io(API_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
  withCredentials: true
});

export function connectSocket() {
  const token = localStorage.getItem("clothswapToken");

  if (!token) {
    socket.disconnect();
    return;
  }

  if (socket.connected) {
    return;
  }

  socket.auth = {
    token: token
  };

  socket.connect();
}

export function disconnectSocket() {
  socket.disconnect();
}

export default socket;
