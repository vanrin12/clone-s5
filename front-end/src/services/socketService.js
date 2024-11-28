import { handleMessagesRead, handleNewMessage, setOnlineUsers, updateUserStatus } from "../store/features/Messenger/messagerSlice";
import { io } from 'socket.io-client';

let socketInstance = null;

export const socketService = {
  init(userId, dispatch) {
    if (!socketInstance) {
      socketInstance = io('http://localhost:5000', {
        query: { userId },
        autoConnect: true,
        reconnection: true,
      });

      // Cài đặt các socket listeners
      socketInstance.on('newMessage', (msg) => {
        dispatch(handleNewMessage(msg));
      });

      socketInstance.on('getOnlineUsers', (users) => {
        dispatch(setOnlineUsers(users));
      });

      socketInstance.on('messagesRead', (data) => {
        dispatch(handleMessagesRead(data));
      });

      socketInstance.on('userStatusUpdate', (data) => {
        dispatch(updateUserStatus({
          userId: data.userId,
          lastActiveAt: data.lastActiveAt
        }));
      });
    }
    return socketInstance;
  },

  emit(event, data) {
    if (socketInstance) {
      socketInstance.emit(event, data);
    }
  },

  updateUserStatus(userId, status) {
    if (socketInstance) {
      socketInstance.emit('updateUserStatus', { userId, status });
    }
  },

  getSocket() {
    return socketInstance;
  },

  disconnect() {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }
  }
};
