import React, { useEffect, useState, } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChatWindow } from "./chatWindow"
import {
  connectSocket,
  fetchConversationList,
  fetchMessages,
  setSelectedChat
} from '../../store/features/Messenger/messagerSlice';

// Constants for SessionStorage keys
const STORAGE_KEYS = {
  MINIMIZED_CHATS: 'minimizedChats',
  MAXIMIZED_CHATS: 'maximizedChats'
};

// Helper functions for SessionStorage
const saveToSessionStorage = (key, data) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to SessionStorage:', error);
  }
};

const getFromSessionStorage = (key) => {
  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error reading from SessionStorage:', error);
    return null;
  }
};

// Component cho cửa sổ chat đã minimize
export const MinimizedChatBubble = ({ chat, onMaximize, onClose, index }) => {
  return (
    <div
      className="fixed"
      style={{
        bottom: `${index * 60 + 20}px`,
        right: '20px',
        zIndex: 50
      }}
    >
      <div className="relative">
        <img
          src={chat.avatar}
          alt={chat.username}
          className="w-12 h-12 rounded-full cursor-pointer border-2 border-white shadow-lg hover:scale-105 transition-transform"
          onClick={onMaximize}
        />
        {chat.online && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 status-online" />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose(false);
          }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 color-mini-x"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const MiniMessenger = () => {
  // Component logic remains the same
  const dispatch = useDispatch();
  const myUserId = useSelector(state => state.messenger.myUserId);
  const conversationList = useSelector(state => state.messenger.conversationList);
  const onlineUsers = useSelector(state => state.messenger.onlineUsers);
  const userStatuses = useSelector(state => state.messenger.userStatuses);
  const [searchTerm, setSearchTerm] = useState('');
  const [minimizedChats, setMinimizedChats] = useState(() => {
    return getFromSessionStorage(STORAGE_KEYS.MINIMIZED_CHATS) || [];
  });
  const [maximizedChats, setMaximizedChats] = useState(() => {
    return getFromSessionStorage(STORAGE_KEYS.MAXIMIZED_CHATS) || [];
  });
  const MAX_VISIBLE_WINDOWS = 3;
  useEffect(() => {
    saveToSessionStorage(STORAGE_KEYS.MINIMIZED_CHATS, minimizedChats);
  }, [minimizedChats]);

  useEffect(() => {
    saveToSessionStorage(STORAGE_KEYS.MAXIMIZED_CHATS, maximizedChats);
  }, [maximizedChats]);

  useEffect(() => {
    const allChats = [...maximizedChats, ...minimizedChats];
    allChats.forEach(chat => {
      dispatch(fetchMessages(chat.userId));
    });
  }, []);

  useEffect(() => {
    if (myUserId) {
      dispatch(connectSocket(myUserId));
      dispatch(fetchConversationList());
    }
  }, [myUserId, dispatch]);

  const handleUserSelect = async (userId) => {
    const user = conversationList.find(conv => conv.member._id === userId)?.member;
    if (!user) return;

    const newChat = {
      userId,
      username: user.username,
      fullname: user.fullname,
      avatar: user.profilePicture || '/default-avatar.png',
      online: onlineUsers.includes(userId),
      lastSeenText: userStatuses[userId]?.lastSeenText
    };

    const existingMaximizedIndex = maximizedChats.findIndex(chat => chat.userId === userId);
    const existingMinimizedIndex = minimizedChats.findIndex(chat => chat.userId === userId);

    if (existingMaximizedIndex !== -1) {
      const updatedMaximized = maximizedChats.filter(chat => chat.userId !== userId);
      setMaximizedChats([newChat, ...updatedMaximized]);
    } else if (existingMinimizedIndex !== -1) {
      if (maximizedChats.length < MAX_VISIBLE_WINDOWS) {
        const updatedMinimized = minimizedChats.filter(chat => chat.userId !== userId);
        setMinimizedChats(updatedMinimized);
        setMaximizedChats([newChat, ...maximizedChats]);
      }
    } else {
      if (maximizedChats.length >= MAX_VISIBLE_WINDOWS) {
        const lastChat = maximizedChats[maximizedChats.length - 1];
        setMinimizedChats([lastChat, ...minimizedChats]);
        const remainingChats = maximizedChats.slice(0, -1);
        setMaximizedChats([newChat, ...remainingChats]);
      } else {
        setMaximizedChats([newChat, ...maximizedChats]);
      }
    }

    await dispatch(fetchMessages(userId));
    dispatch(setSelectedChat(newChat));
  };

  // Thay đổi handleClose
  const handleClose = (chatId, minimize = false) => {
    if (minimize) {
      const chatToMinimize = maximizedChats.find(chat => chat.userId === chatId);
      if (chatToMinimize) {
        setMaximizedChats(maximizedChats.filter(chat => chat.userId !== chatId));
        setMinimizedChats([chatToMinimize, ...minimizedChats]);
      }
    } else {
      setMaximizedChats(maximizedChats.filter(chat => chat.userId !== chatId));
      setMinimizedChats(minimizedChats.filter(chat => chat.userId !== chatId));
    }
  };

  const handleMaximize = (chatId) => {
    const chatToMaximize = minimizedChats.find(chat => chat.userId === chatId);
    if (chatToMaximize) {
      if (maximizedChats.length >= MAX_VISIBLE_WINDOWS) {
        const lastChat = maximizedChats[maximizedChats.length - 1];
        setMinimizedChats([lastChat, ...minimizedChats.filter(chat => chat.userId !== chatId)]);
        const remainingChats = maximizedChats.slice(0, -1);
        setMaximizedChats([chatToMaximize, ...remainingChats]);
      } else {
        setMinimizedChats(minimizedChats.filter(chat => chat.userId !== chatId));
        setMaximizedChats([chatToMaximize, ...maximizedChats]);
      }
    }
  };

  const filteredConversations = conversationList.filter(conv =>
    conv.member.fullname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Contact List */}
      <div className="w-80 bg-white border-r overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Trò chuyện</h2>
        </div>
        <div className="divide-y">
          {filteredConversations.map(conv => (
            <button
              key={conv.member._id}
              onClick={() => handleUserSelect(conv.member._id)}
              className="w-full p-4 hover:bg-gray-50 flex items-center space-x-3 text-left"
            >
              <div className="relative">
                <img
                  src={conv.member.profilePicture || '/default-avatar.png'}
                  alt={conv.member.username}
                  className="w-12 h-12 rounded-full"
                />
                {onlineUsers.includes(conv.member._id) && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 status-online" />
                )}
              </div>
              <div>
                <div className="font-medium">{conv.member.fullname}</div>
                {/* <div className="text-sm text-gray-500">
                  {conv.lastMessage || 'Bắt đầu cuộc trò chuyện'}
                </div> */}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Windows */}
      <div className="fixed bottom-0 right-0 flex flex-col items-end">
        {/* Minimized chats */}
        <div className="flex flex-col-reverse items-end space-y-reverse space-y-2 mb-2 mr-4">
          {minimizedChats.map((chat, index) => (
            <MinimizedChatBubble
              key={chat.userId}
              chat={chat}
              onMaximize={() => handleMaximize(chat.userId)}
              onClose={() => handleClose(chat.userId, false)}
              index={index}
            />
          ))}
        </div>

        {/* Maximized chats */}
        <div className="flex items-end space-x-4 px-4">
          {maximizedChats.map((chat, index) => (
            <ChatWindow
              key={chat.userId}
              chat={chat}
              onClose={(minimize) => handleClose(chat.userId, minimize)}
              index={index}
              totalChats={maximizedChats.length}
              isMinimized={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MiniMessenger;