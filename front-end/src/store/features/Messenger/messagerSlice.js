import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { socketService } from './../../../services/socketService';
import config from './../../../config';

// Helper function để format tin nhắn
const formatMessage = (msg) => {
  let messageContent = msg.message;
  if (typeof msg.message === 'string' && msg.message.startsWith('{')) {
    try {
      const parsedMessage = JSON.parse(msg.message);
      messageContent = parsedMessage.message || msg.message;
    } catch (e) {
      messageContent = msg.message;
    }
  }

  return {
    _id: msg._id || new Date().getTime().toString(),
    message: messageContent,
    senderId: typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId,
    receiverId: typeof msg.receiverId === 'object' ? msg.receiverId._id : msg.receiverId,
    timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
    pending: msg.pending || false
  };
};

// Async thunks
export const connectSocket = createAsyncThunk(
  'messenger/connectSocket',
  async (userId, { dispatch }) => {
    socketService.init(userId, dispatch);
    return userId;
  }
);

export const fetchConversationList = createAsyncThunk(
  'messenger/fetchConversationList',
  async () => {
    const response = await fetch(`${config.API_HOST}/api/message/person`, {
      method: 'GET',
      credentials: 'include'
    });
    const data = await response.json();
    return {
      conversations: data.conversations || [], // Add default empty array
      unreadCounts: data.unreadCounts || [] // Add default empty array
    };
  }
);

export const fetchMessages = createAsyncThunk(
  'messenger/fetchMessages',
  async (userId) => {
    const response = await fetch(`${config.API_HOST}/api/message/getMess/${userId}`, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await response.json();
    return {
      userId,
      messages: data.messages?.map(formatMessage) || [],
      conversation: data.conversation
    };
  }
);

export const sendMessage = createAsyncThunk(
  'messenger/sendMessage',
  async ({ receiverId, message, tempMessageId }, { getState, dispatch }) => {
    try {
      const response = await fetch(`${config.API_HOST}/api/message/send/${receiverId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (data.success && data.message) {
        socketService.emit('sendMessage', {
          ...data.message,
          senderId: getState().messenger.myUserId,
          receiverId,
          message
        });

        return {
          success: true,
          tempMessageId,
          message: data.message,
          receiverId
        };
      }

      throw new Error('Failed to send message');
    } catch (error) {
      dispatch(handleMessageFailure({ tempMessageId, receiverId }));
      throw error;
    }
  }
);

export const sendQuickIcon = createAsyncThunk(
  'messenger/sendQuickIcon',
  async ({ receiverId, icon = '👍' }, { getState, dispatch }) => {
    const tempMessageId = new Date().getTime().toString();
    return dispatch(sendMessage({
      receiverId,
      message: icon,
      tempMessageId
    })).unwrap();
  }
);

const getLastSeenText = (lastActiveAt) => {
  if (!lastActiveAt) return 'Không hoạt động';

  const now = new Date();
  const lastActive = new Date(lastActiveAt);
  const diffInSeconds = Math.floor((now - lastActive) / 1000);

  if (diffInSeconds < 60) return 'Vừa truy cập';

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `Hoạt động ${diffInMinutes} phút trước`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Hoạt động ${diffInHours} giờ trước`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Hoạt động từ hôm qua';
  if (diffInDays < 7) return `Không hoạt động ${diffInDays} ngày trước`;

  return `Hoạt động cuối ${lastActive.toLocaleDateString('vi-VN')}`;
};

const messengerSlice = createSlice({
  name: 'messenger',
  initialState: {
    myUserId: localStorage.getItem('_id'),
    loading: false,
    selectedChat: null,
    onlineUsers: [],
    messages: {},
    instantMessages: {},
    conversationList: [],
    chatUsers: {},
    userStatuses: {},
    unreadCounts: {},
    searchResults: [],
    error: null
  },
  reducers: {
    setSelectedChat: (state, action) => {
      state.selectedChat = action.payload;
    },
    setOnlineUsers: (state, action) => {
      const onlineUserIds = action.payload;
      const previousOnlineUsers = state.onlineUsers;
      state.onlineUsers = onlineUserIds;

      // Cập nhật lastActiveAt cho những user vừa offline
      const newOfflineUsers = previousOnlineUsers.filter(id => !onlineUserIds.includes(id));
      newOfflineUsers.forEach(userId => {
        state.userStatuses[userId] = {
          ...state.userStatuses[userId],
          lastActiveAt: new Date().toISOString(),
          lastSeenText: 'Truy cập 1 phút trước',
          online: false
        };
      });

      // Cập nhật trạng thái cho users đang online
      onlineUserIds.forEach(userId => {
        if (state.userStatuses[userId]) {
          state.userStatuses[userId] = {
            ...state.userStatuses[userId],
            online: true,
            lastSeenText: 'Đang hoạt động'
          };
        }
      });

      // Cập nhật conversation list
      state.conversationList = state.conversationList.map(conversation => ({
        ...conversation,
        member: {
          ...conversation.member,
          isOnline: onlineUserIds.includes(conversation.member._id),
          lastActiveAt: !onlineUserIds.includes(conversation.member._id)
            ? new Date().toISOString()
            : conversation.member.lastActiveAt
        }
      }));
    },

    updateUserStatus: (state, action) => {
      const { userId, lastActiveAt } = action.payload;
      const isOnline = state.onlineUsers.includes(userId);

      state.userStatuses[userId] = {
        ...state.userStatuses[userId],
        lastActiveAt: isOnline ? null : lastActiveAt,
        lastSeenText: isOnline ? 'Đang hoạt động' : getLastSeenText(lastActiveAt),
        online: isOnline
      };

      // Cập nhật trong conversation list
      const conversationIndex = state.conversationList.findIndex(
        conv => conv.member._id === userId
      );
      if (conversationIndex !== -1) {
        state.conversationList[conversationIndex].member = {
          ...state.conversationList[conversationIndex].member,
          lastActiveAt: isOnline ? null : lastActiveAt,
          isOnline
        };
      }
    },
    handleNewMessage: (state, action) => {
      const formattedMessage = formatMessage(action.payload);
      const chatId = formattedMessage.senderId === state.myUserId ?
        formattedMessage.receiverId : formattedMessage.senderId;

      // Update instantMessages
      if (!state.instantMessages[chatId]) {
        state.instantMessages[chatId] = [];
      }
      if (!state.instantMessages[chatId].some(m => m._id === formattedMessage._id)) {
        state.instantMessages[chatId].push(formattedMessage);
      }

      // Update messages if it's current chat
      if (state.selectedChat?.userId === chatId) {
        if (!state.messages[chatId]) {
          state.messages[chatId] = [];
        }
        if (!state.messages[chatId].some(m => m._id === formattedMessage._id)) {
          state.messages[chatId].push(formattedMessage);
        }
      }

      // Update conversation list
      const conversationIndex = state.conversationList.findIndex(
        conv => conv.member._id === chatId
      );

      if (conversationIndex !== -1) {
        const updatedConv = {
          ...state.conversationList[conversationIndex],
          lastMessage: formattedMessage.message,
          lastMessageTime: formattedMessage.timestamp
        };
        state.conversationList = [
          updatedConv,
          ...state.conversationList.filter((_, index) => index !== conversationIndex)
        ];
      }
    },

    handleMessagesRead: (state, action) => {
      const { conversationId } = action.payload;
      if (state.messages[conversationId]) {
        state.messages[conversationId] = state.messages[conversationId].map(
          msg => ({ ...msg, read: true })
        );
      }
    },

    handleMessageFailure: (state, action) => {
      const { tempMessageId, receiverId } = action.payload;
      // Remove failed message from both states
      if (state.messages[receiverId]) {
        state.messages[receiverId] = state.messages[receiverId].filter(
          msg => msg._id !== tempMessageId
        );
      }
      if (state.instantMessages[receiverId]) {
        state.instantMessages[receiverId] = state.instantMessages[receiverId].filter(
          msg => msg._id !== tempMessageId
        );
      }
    },

    setSearchResults: (state, action) => {
      state.searchResults = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(connectSocket.pending, (state) => {
        state.loading = true;
      })
      .addCase(connectSocket.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(fetchConversationList.fulfilled, (state, action) => {
        const { conversations = [], unreadCounts = [] } = action.payload;

        // Cập nhật conversation list với trạng thái online
        state.conversationList = conversations.map(conv => ({
          ...conv,
          member: {
            ...conv.member,
            isOnline: state.onlineUsers.includes(conv.member._id)
          }
        }));
        conversations.forEach(conv => {
          if (conv?.member) {
            state.userStatuses[conv.member._id] = {
              ...state.userStatuses[conv.member._id],
              lastActiveAt: conv.member.lastActiveAt,
              lastSeenText: getLastSeenText(conv.member.lastActiveAt),
              online: state.onlineUsers.includes(conv.member._id)
            };
          }
        });
        // Xử lý unreadCounts như cũ
        state.unreadCounts = Array.isArray(unreadCounts)
          ? unreadCounts.reduce((acc, item) => {
            if (item && item.userId) {
              acc[item.userId] = item.count || 0;
            }
            return acc;
          }, {})
          : {};

        // Cập nhật chatUsers với trạng thái online
        if (Array.isArray(conversations)) {
          conversations.forEach(conv => {
            if (conv?.member) {
              state.chatUsers[conv.member._id] = {
                username: conv.member.username,
                fullname: conv.member.fullname,
                profilePicture: conv.member.profilePicture || '/default-avatar.png',
                lastMessageTime: conv.lastMessageTime,
                _id: conv.member._id,
                isOnline: state.onlineUsers.includes(conv.member._id)
              };
            }
          });
        }
      })
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { userId, messages, conversation } = action.payload;
        state.messages[userId] = messages;
        state.instantMessages[userId] = messages;
        state.loading = false;

        // Update user info if available
        if (conversation?.members) {
          conversation.members.forEach(member => {
            if (member._id !== state.myUserId) {
              state.chatUsers[member._id] = {
                username: member.username,
                fullname: member.fullname,
                profilePicture: member.profilePicture || '/default-avatar.png',
                _id: member._id
              };
            }
          });
        }
      })
      .addCase(sendMessage.pending, (state, action) => {
        const { tempMessageId, receiverId, message } = action.meta.arg;
        const tempMessage = {
          _id: tempMessageId,
          message,
          senderId: state.myUserId,
          receiverId,
          timestamp: new Date().toISOString(),
          pending: true
        };

        // Add to both messages and instantMessages
        if (!state.messages[receiverId]) state.messages[receiverId] = [];
        if (!state.instantMessages[receiverId]) state.instantMessages[receiverId] = [];

        state.messages[receiverId].push(tempMessage);
        state.instantMessages[receiverId].push(tempMessage);

        // Update conversation list
        const conversationIndex = state.conversationList.findIndex(
          conv => conv.member._id === receiverId
        );

        if (conversationIndex !== -1) {
          const updatedConv = {
            ...state.conversationList[conversationIndex],
            lastMessage: message,
            lastMessageTime: tempMessage.timestamp,
            pending: true
          };
          state.conversationList = [
            updatedConv,
            ...state.conversationList.filter((_, index) => index !== conversationIndex)
          ];
        }
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { tempMessageId, message, receiverId } = action.payload;

        // Update messages and instantMessages
        ['messages', 'instantMessages'].forEach(messageType => {
          if (state[messageType][receiverId]) {
            state[messageType][receiverId] = state[messageType][receiverId].map(msg =>
              msg._id === tempMessageId ? { ...formatMessage(message), pending: false } : msg
            );
          }
        });

        // Update conversation list
        const conversationIndex = state.conversationList.findIndex(
          conv => conv.member._id === receiverId
        );

        if (conversationIndex !== -1) {
          const updatedConv = {
            ...state.conversationList[conversationIndex],
            lastMessage: message.message,
            lastMessageTime: message.timestamp || message.createdAt,
            pending: false
          };
          state.conversationList = [
            updatedConv,
            ...state.conversationList.filter((_, index) => index !== conversationIndex)
          ];
        }
      });
  },
});


export const {
  setSelectedChat,
  setOnlineUsers,
  handleNewMessage,
  handleMessagesRead,
  updateUserStatus,
  handleMessageFailure,
  setSearchResults,
} = messengerSlice.actions;

export default messengerSlice.reducer;