import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { IoCall } from "react-icons/io5";
import { MdVideocam } from "react-icons/md";
import { Smile } from 'lucide-react';
import { RiSendPlane2Fill } from "react-icons/ri";
import { AiFillLike } from "react-icons/ai";
import { BsFillMicFill } from "react-icons/bs";
import { IoMdImages } from "react-icons/io";
import { GoPlusCircle } from "react-icons/go";
import {
  sendMessage,
  sendQuickIcon,
  updateUserStatus
} from '../../store/features/Messenger/messagerSlice';
import { useDispatch, useSelector } from 'react-redux';
import { MinimizedChatBubble } from '.';


// Component cho cửa sổ chat
export const ChatWindow = ({ chat, onClose, isMinimized, onMaximize, onMinimize, index, totalChats }) => {
  const dispatch = useDispatch();
  const messages = useSelector(state => state.messenger.instantMessages[chat.userId] || []);
  const userStatuses = useSelector(state => state.messenger.userStatuses);
  const myUserId = useSelector(state => state.messenger.myUserId);
  const [newMessage, setNewMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const chatContainerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const initialScrollRef = useRef(false);
  const [showHiddenIcons, setShowHiddenIcons] = useState(false);
  const [isFocused, setIsFocused] = useState(false);


  useEffect(() => {
    if (!chat.online && chat.lastActiveAt) {
      dispatch(updateUserStatus({
        userId: chat.userId,
        lastActiveAt: chat.lastActiveAt
      }));
    }
  }, [chat.online, chat.lastActiveAt, chat.userId, dispatch]);

  // Cập nhật trạng thái mỗi phút
  useEffect(() => {
    if (!chat.online && chat.lastActiveAt) {
      const interval = setInterval(() => {
        dispatch(updateUserStatus({
          userId: chat.userId,
          lastActiveAt: chat.lastActiveAt
        }));
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [chat.online, chat.lastActiveAt, chat.userId, dispatch]);

  useEffect(() => {
    if (!newMessage.trim()) {
      setShowHiddenIcons(false);
    }
  }, [newMessage]);

  // Tối ưu hóa việc xử lý tin nhắn unique bằng useMemo
  const uniqueMessages = useMemo(() => {
    const messageMap = new Map();
    // Sắp xếp messages theo thời gian từ cũ đến mới
    const sortedMessages = [...messages].sort((a, b) => {
      const timeA = new Date(a.timestamp || a.createdAt).getTime();
      const timeB = new Date(b.timestamp || b.createdAt).getTime();
      return timeA - timeB;
    });

    sortedMessages.forEach(msg => {
      const key = msg._id || msg.tempMessageId;
      if (!messageMap.has(key)) {
        messageMap.set(key, msg);
      }
    });

    return Array.from(messageMap.values());
  }, [messages]);

  // Effect để xử lý initial scroll khi messages được load
  useEffect(() => {
    if (!chatContainerRef.current || uniqueMessages.length === 0) return;

    if (!initialScrollRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      initialScrollRef.current = true;
      setIsLoaded(true);
    }
  }, [uniqueMessages]);

  // Effect riêng để xử lý scroll khi có tin nhắn mới
  useEffect(() => {
    if (!chatContainerRef.current || !isLoaded) return;

    const scrollPosition = chatContainerRef.current.scrollTop;
    const scrollHeight = chatContainerRef.current.scrollHeight;
    const clientHeight = chatContainerRef.current.clientHeight;

    // Kiểm tra nếu user đang ở gần bottom (trong khoảng 100px)
    const isNearBottom = scrollHeight - scrollPosition - clientHeight < 100;

    if (isNearBottom) {
      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      });
    }
  }, [uniqueMessages, isLoaded]);

  // Reset trạng thái khi component unmount
  useEffect(() => {
    return () => {
      initialScrollRef.current = false;
      setIsLoaded(false);
    };
  }, []);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (newMessage.trim()) {
      const tempMessageId = `temp-${Date.now()}-${Math.random()}`;
      dispatch(sendMessage({
        receiverId: chat.userId,
        message: newMessage.trim(),
        tempMessageId
      }));
      setNewMessage('');
      setShowHiddenIcons(false);

      // Scroll to bottom sau khi gửi tin nhắn
      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      });
    } else {
      dispatch(sendQuickIcon({ receiverId: chat.userId }));
    }
  };

  // Tối ưu hóa render message bằng useCallback
  const renderMessage = useCallback((msg) => {
    const isMyMessage = msg.senderId === myUserId;
    const messageTime = new Date(msg.timestamp || msg.createdAt || Date.now())
      .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isLikeMessage = msg.message === '👍';
    const messageKey = msg._id || msg.tempMessageId;

    return (
      <div
        key={messageKey}
        className={`mb-4 flex items-end space-x-2 ${isMyMessage ? 'justify-end' : 'justify-start'}`}
      >
        {!isMyMessage && (
          <img
            src={chat.avatar}
            alt={chat.username}
            className="w-8 h-8 rounded-full flex-shrink-0"
          />
        )}
        <div
          className={`${isLikeMessage
            ? 'bg-transparent'
            : isMyMessage
              ? 'background-me color-me rounded-l-lg rounded-tr-lg'
              : 'background-you color-you rounded-r-lg rounded-tl-lg'
            } px-4 py-2 container-chatwindow`}
          style={{
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            minWidth: isLikeMessage ? 'auto' : '60px',
            maxWidth: 'calc(100% - 60px)',
            color: isMyMessage ? '#fff !important' : '#fff !important'
          }}
        >
          {isLikeMessage ? (
            <AiFillLike className="w-8 h-8 text-blue-500" />
          ) : (
            <p className={`whitespace-pre-wrap ${isMyMessage ? 'text-white' : 'text-gray-800'}`}>
              {msg.message}
            </p>
          )}
          <span className={`text-xs block mt-1 color-time ${isMyMessage ? 'span-me' : 'span-you'}`}>
            {messageTime}
            {msg.pending && ' Đang gửi...'}
          </span>
        </div>
      </div>
    );
  }, [myUserId, chat.avatar, chat.username]);

  const handleToggleIcons = () => {
    setShowHiddenIcons(prev => !prev); // Đảo trạng thái hiển thị icon phía trên
  };

  if (isMinimized) {
    return (
      <MinimizedChatBubble
        chat={chat}
        onMaximize={onMaximize}
        onClose={onClose}
        index={index}
      />
    );
  }

  return (
    <div
      className="fixed bottom-0 bg-white shadow-xl rounded-t-lg overflow-hidden"
      style={{
        width: '330px',
        right: `${index * 340 + 100}px`,
        zIndex: 40
      }}
    >
      {/* Header */}
      <div className="bg-white border-b p-0.5 flex justify-between items-center">
        <div className="flex items-center space-x-2 flex-1 cursor-pointer hover:bg-gray-100 rounded-lg p-1">
          <div className="relative">
            <img
              src={chat.avatar}
              alt={chat.username}
              className="w-9 h-9 rounded-full"
            />
            {chat.online && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 status-online-header" />
            )}
          </div>
          <div>
            <div className="font-semibold text-gray-800">{chat.fullname}</div>
            <div className="text-xs text-gray-500">
              {chat.online
                ? 'Đang hoạt động'
                : userStatuses[chat.userId]?.lastSeenText || 'Không hoạt động'}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1 svg-color">
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <IoCall className="w-5 h-5" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <MdVideocam className="w-5 h-5" />
          </button>
          <button
            onClick={() => onClose(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button
            onClick={() => onClose(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={chatContainerRef}
        className="h-96 overflow-y-auto p-4 bg-gray-100"
      >
        <div className="flex flex-col justify-end min-h-full">
          {uniqueMessages.map(renderMessage)}
        </div>
      </div>

      {/* Hiển thị các icon phía trên khi nhấn GoPlusCircle */}
      {showHiddenIcons && (
        <div className="p-2 flex justify-center space-x-4 bg-gray-100 border-b transform transition-all duration-300 ease-in-out">
          <button className="p-2 rounded-full hover:bg-gray-200 transform hover:scale-110 transition-transform">
            <BsFillMicFill className="w-6 h-6 text-gray-600" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-200 transform hover:scale-110 transition-transform">
            <IoMdImages className="w-6 h-6 text-gray-600 " />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-white border-t">
        <div className="flex items-center space-x-2">
          {/* Plus icon với animation */}
          <div className={`transition-all duration-300 ease-in-out ${newMessage.trim() ? 'w-10' : 'w-20'}`}>
            {newMessage.trim() ? (
              <button
                onClick={handleToggleIcons}
                className="p-2 rounded-full hover:bg-gray-100 transform hover:scale-110 transition-transform"
              >
                <GoPlusCircle className="w-6 h-6 text-gray-600" />
              </button>
            ) : (
              <div className="flex items-center space-x-1 svg-color">
                <button className="p-2 rounded-full hover:bg-gray-100 transform hover:scale-110 transition-transform">
                  <BsFillMicFill className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 transform hover:scale-110 transition-transform">
                  <IoMdImages className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Input container với animation */}
          <div
            className={`flex-1 flex items-center bg-gray-100 rounded-full px-2 transition-all duration-300 ease-in-out ${isFocused || newMessage.trim() ? 'w-full ring-2 ring-blue-200' : 'w-[calc(100%-80px)]'
              }`}
          >
            <input
              type="text"
              value={newMessage}
              onChange={e => {
                setNewMessage(e.target.value);
              }}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Aa"
              className="w-full py-2 bg-transparent transition-all duration-300 input-chatwindow"
              style={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                minHeight: '32px',
                maxHeight: '200px',
                overflowY: 'auto',
              }}
            />
            <button
              className="p-1 rounded-full hover:bg-gray-200 transform hover:scale-110 transition-transform"
              onClick={() => setShowEmoji(!showEmoji)}
            >
              <Smile className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Send/Like button với animation */}
          <button
            onClick={handleSend}
            className="p-2 rounded-full hover:bg-gray-100 transform hover:scale-110 transition-all duration-300"
          >
            {newMessage.trim() ? (
              <RiSendPlane2Fill className="w-6 h-6 text-blue-500" />
            ) : (
              <AiFillLike className="w-6 h-6 text-blue-500" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};