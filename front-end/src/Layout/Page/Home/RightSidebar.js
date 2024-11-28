import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import {
  fetchConversationList,
  setSelectedChat,
  connectSocket,
  fetchMessages,
} from '../../../store/features/Messenger/messagerSlice';
import { ChatWindow } from './../../../Components/Messenger/chatWindow';
import "./RightSiderbar.scss";
import "./Home.scss";

// Constants for SessionStorage
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

// MinimizedChatBubble Component
const MinimizedChatBubble = ({ chat, onMaximize, onClose, index, onlineUsers, userStatuses }) => {
  const isOnline = onlineUsers.includes(chat.userId);
  const userStatus = userStatuses[chat.userId] || {};
  const lastSeenText = !isOnline ? userStatus.lastSeenText : null;

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
          className="w-11 h-11 rounded-full cursor-pointer border-white shadow-lg hover:scale-105 transition-transform"
          onClick={onMaximize}
        />
        {isOnline && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 status-online" />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose(false);
          }}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center hover:bg-gray-300 color-mini-x"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {/* {!isOnline && lastSeenText && (
          <div className="absolute -bottom-6 left-0 text-xs text-gray-400 whitespace-nowrap">
            {lastSeenText}
          </div>
        )} */}
      </div>
    </div>
  );
};

export const RightSidebar = ({
  expandSuggestions,
  setExpandSuggestions,
  isHovered,
  setIsHovered
}) => {
  const dispatch = useDispatch();
  const { conversationList, unreadCounts, onlineUsers, userStatuses, myUserId } = useSelector(state => state.messenger);
  const [minimizedChats, setMinimizedChats] = useState(() =>
    getFromSessionStorage(STORAGE_KEYS.MINIMIZED_CHATS) || []
  );
  const [maximizedChats, setMaximizedChats] = useState(() =>
    getFromSessionStorage(STORAGE_KEYS.MAXIMIZED_CHATS) || []
  );
  const MAX_VISIBLE_WINDOWS = 3;
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const searchRef = useRef(null);
  const containerRef = useRef(null);
  const [inputWidth, setInputWidth] = useState('0%');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        if (!searchValue) setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchValue]);

  useEffect(() => {
    if (isExpanded) {
      setInputWidth('100%');
    } else {
      setInputWidth('0%');
    }
  }, [isExpanded]);

  useEffect(() => {
    dispatch(fetchConversationList());
    if (myUserId) {
      dispatch(connectSocket(myUserId));
    }
  }, [dispatch, myUserId]);

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

  const handleContactSelect = async (contact) => {
    const newChat = {
      userId: contact._id,
      username: contact.fullname || contact.username,
      fullname: contact.fullname,
      avatar: contact.profilePicture || '/default-avatar.png',
      online: onlineUsers.includes(contact._id),
      lastSeenText: userStatuses[contact._id]?.lastSeenText,
      lastActiveAt: userStatuses[contact._id]?.lastActiveAt
    };

    const existingMaximizedIndex = maximizedChats.findIndex(chat => chat.userId === contact._id);
    const existingMinimizedIndex = minimizedChats.findIndex(chat => chat.userId === contact._id);

    if (existingMaximizedIndex !== -1) {
      const updatedMaximized = maximizedChats.filter(chat => chat.userId !== contact._id);
      setMaximizedChats([newChat, ...updatedMaximized]);
    } else if (existingMinimizedIndex !== -1) {
      if (maximizedChats.length < MAX_VISIBLE_WINDOWS) {
        const updatedMinimized = minimizedChats.filter(chat => chat.userId !== contact._id);
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

    await dispatch(fetchMessages(contact._id));
    dispatch(setSelectedChat(newChat));
  };

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
      // Cập nhật thông tin trạng thái mới nhất cho chat
      const updatedChat = {
        ...chatToMaximize,
        online: onlineUsers.includes(chatId),
        lastSeenText: userStatuses[chatId]?.lastSeenText,
        lastActiveAt: userStatuses[chatId]?.lastActiveAt
      };

      if (maximizedChats.length >= MAX_VISIBLE_WINDOWS) {
        const lastChat = maximizedChats[maximizedChats.length - 1];
        setMinimizedChats([lastChat, ...minimizedChats.filter(chat => chat.userId !== chatId)]);
        const remainingChats = maximizedChats.slice(0, -1);
        setMaximizedChats([updatedChat, ...remainingChats]);
      } else {
        setMinimizedChats(minimizedChats.filter(chat => chat.userId !== chatId));
        setMaximizedChats([updatedChat, ...maximizedChats]);
      }

      // Cập nhật selected chat để đồng bộ trạng thái
      dispatch(setSelectedChat(updatedChat));
    }
  };

  return (
    <div className="w-[320px]">
      <div className="fixed right-0 h-screen flex flex-col Sidebar-right" style={{ width: "340px", borderRadius: "10px", padding: "0 10px" }}>
        {/* Suggestions Section */}
        <div className={`${expandSuggestions ? 'flex-1' : ''} overflow-hidden transition-all duration-300`}>
          <div className="p-3 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Gợi ý</h2>
            {!expandSuggestions && (
              <button
                onClick={() => setExpandSuggestions(!expandSuggestions)}
                className="flex items-center  py-2 rounded-lg  btn-suggestions"
              >
                <span>Xem thêm</span>
                <ChevronDown size={20} />
              </button>
            )}
          </div>

          <div className={`${expandSuggestions ? 'h-[calc(100vh-100px)]' : ''} overflow-y-auto`}>
            {(expandSuggestions ? [...Array(28)] : [...Array(2)]).map((_, item) => (
              <div key={item} className="flex items-center p-3 hover:bg-[#3a3344] cursor-pointer">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-700 rounded-full mr-3"></div>
                  <div className="font-medium">Suggested Contact {item + 1}</div>
                </div>
              </div>
            ))}
          </div>

          {expandSuggestions && (
            <div className="p-2 flex justify-center sticky bottom-0 ">
              <button
                onClick={() => setExpandSuggestions(!expandSuggestions)}
                className="flex items-center py-2 rounded-lg btn-suggestions"
              >
                <span>Thu gọn</span>
                <ChevronUp size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Contacts Section */}
        {!expandSuggestions && (
          <div
            className="flex-1 overflow-hidden right-siderbar"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="p-2 title-lh">
              <div className="flex items-center  h-12" ref={containerRef}>
                <div
                  className={`overflow-hidden transition-all duration-500 ease-in-out flex-shrink-0 transform ${isExpanded ? 'w-0 -translate-x-full opacity-0' : 'w-auto translate-x-0 opacity-100'
                    }`}
                >
                  <h2 className="text-lg font-semibold whitespace-nowrap">Người liên hệ</h2>
                </div>
                <div className={`transition-all duration-500 ease-in-out ${!isExpanded ? 'ml-auto' : 'w-full'}`}>
                  {!isExpanded ? (
                    <button
                      className="p-2 rounded-full transition-transform"
                      onClick={() => setIsExpanded(true)}
                    >
                      <Search size={20} />
                    </button>
                  ) : (
                    <div className="relative w-full transform transition-all duration-500 ease-in-out scale-100 opacity-100 input-search-svg">
                      <Search
                        size={20}
                        className="absolute left-3 top-1/2 -translate-y-1/2"
                      />
                      <input
                        ref={searchRef}
                        type="text"
                        style={{
                          width: inputWidth, // Thêm width động
                          transition: 'width 0.5s ease-in-out', // Hiệu ứng mượt cho width
                        }}
                        className="bg-gray-700 rounded-full pl-10 pr-10 py-2 outline-none input-search-user"
                        placeholder="Tìm kiếm..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        autoFocus
                      />
                      {searchValue && (
                        <button
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-all"
                          onClick={() => setSearchValue('')}
                        >
                          <X size={16} className="text-gray-400" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>
            {/* Contact List */}
            <div
              className={`pb-16 Contact-List ${isHovered ? 'overflow-y-auto' : 'overflow-hidden'
                }`}
              style={{
                maxHeight: 'calc(100vh - 230px)',
                transition: 'all 0.3s ease-in-out',
                paddingBottom: '20px'
              }}
            >
              {conversationList.map((conversation) => {
                const contact = conversation.member;
                return (
                  <div
                    key={contact._id}
                    className="flex items-center p-3 hover:bg-gray-800 cursor-pointer list-item-contact"
                    onClick={() => handleContactSelect(contact)}
                  >
                    <div className="flex gap-3 items-center relative">
                      <div className="relative">
                        <img
                          src={contact.profilePicture || '/default-avatar.png'}
                          alt={contact.fullname || contact.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        {/* online offline user list */}
                        {contact.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 status-online" />
                        )}
                      </div>
                      <div className="font-medium">
                        {contact.fullname || contact.username}
                      </div>
                      {unreadCounts[contact._id] > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                          {unreadCounts[contact._id]}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {/* Chat Windows */}
      <div className="fixed bottom-0 right-0 flex flex-col items-end contaier-chat">
        {/* Minimized chats */}
        <div className="flex flex-col-reverse items-end space-y-reverse space-y-2 mb-2 mr-4 MinimizedChatBubble">
          {minimizedChats.map((chat, index) => (
            <MinimizedChatBubble
              key={chat.userId}
              chat={chat}
              onMaximize={() => handleMaximize(chat.userId)}
              onClose={() => handleClose(chat.userId, false)}
              index={index}
              onlineUsers={onlineUsers}
              userStatuses={userStatuses}
            />
          ))}
        </div>

        {/* Maximized chats */}
        <div className="flex items-end space-x-4 px-4 right-header-icon">
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