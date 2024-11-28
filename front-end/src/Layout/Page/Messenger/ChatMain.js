import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Smile } from 'lucide-react';
import { RiSendPlane2Fill } from "react-icons/ri";
import { CiImageOn } from "react-icons/ci";
import { PiDotsThreeBold } from "react-icons/pi";
import { AiFillLike } from "react-icons/ai";
import { Call } from './Call';

export const ChatMain = ({
  selectedChat,
  loading,
  messages,
  myUserId,
  newMessage,
  handleTyping,
  sendMessage,
  userId,
  sendQuickIcon,
}) => {
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const chatContainerRef = useRef(null);
  const isFirstLoad = useRef(true);

  const handleGoToProfile = () => {
    navigate(`/profile/${userId}`);
  };

  const handleQuickLike = () => {
    sendQuickIcon('👍');
  };

  // Cập nhật hàm handleSend
  const handleSend = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage();
    } else {
      handleQuickLike();
    }
  };

  const scrollToBottom = (behavior = 'auto') => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: behavior
      });
    }
  };

  useEffect(() => {
    if (!chatContainerRef.current) return;

    if (isFirstLoad.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      isFirstLoad.current = false;
    } else {
      scrollToBottom('smooth');
    }
  }, [messages]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  // Các hàm helper
  const getMessageContent = (msg) => {
    try {
      if (typeof msg.message === 'object') return '';
      if (typeof msg.message === 'string') return msg.message;
      return '';
    } catch (error) {
      return '';
    }
  };

  const checkIsMyMessage = (msg) => {
    try {
      if (!msg || !myUserId) return false;

      if (typeof msg.senderId === 'object' && msg.senderId !== null) {
        return msg.senderId._id === myUserId;
      }

      if (typeof msg.senderId === 'string') {
        return msg.senderId === myUserId;
      }

      if (msg.senderId?.id) {
        return msg.senderId.id === myUserId;
      }

      return false;
    } catch (error) {
      console.error('Error in checkIsMyMessage:', error);
      return false;
    }
  };

  const getMessageTime = (msg) => {
    try {
      const timestamp = msg.timestamp || msg.createdAt || Date.now();
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '';
    }
  };

  const getSenderName = (msg, isMyMessage) => {
    try {
      if (isMyMessage) return 'You';

      if (msg.senderId?.fullname) {
        return msg.senderId.fullname;
      }

      if (msg.senderId?.username) {
        return msg.senderId.username;
      }

      if (selectedChat?.fullname) {
        return selectedChat.fullname;
      }

      return 'User';
    } catch (error) {
      console.error('Error in getSenderName:', error);
      return 'User';
    }
  };

  const renderMessage = (msg, index) => {
    try {
      if (!msg) return null;

      const isMyMessage = checkIsMyMessage(msg);
      const messageContent = getMessageContent(msg);
      const senderName = getSenderName(msg, isMyMessage);
      const messageTime = getMessageTime(msg);
      const senderAvatar = msg.senderId?.profilePicture || selectedChat?.avatar || '/default-avatar.png';

      if (!messageContent) return null;

      // Kiểm tra nếu là tin nhắn like để hiển thị icon lớn hơn
      const isLikeMessage = messageContent === '👍';

      return (
        <div
          key={msg._id || index}
          className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} items-end space-x-2 mb-4`}
        >
          {!isMyMessage && (
            <img
              src={senderAvatar}
              alt={senderName}
              className="w-8 h-8 rounded-full flex-shrink-0"
            />
          )}
          <div
            className={`${isLikeMessage ? 'bg-transparent' : isMyMessage
              ? 'bg-[#7924FF] rounded-l-lg rounded-tr-lg'
              : 'bg-[#303030] rounded-r-lg rounded-tl-lg'
              } px-4 py-2`}
            style={{
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              minWidth: isLikeMessage ? 'auto' : '60px',
              maxWidth: 'calc(100% - 200px)'
            }}
          >
            {isLikeMessage ? (
              <AiFillLike className="w-8 h-8 text-blue-500" />
            ) : (
              <p className="text-white whitespace-pre-wrap">{messageContent}</p>
            )}
            <span className="text-xs text-gray-300 mt-1 block">
              {messageTime}
              <br />
              {msg.pending && ' Đang gửi...'}
            </span>
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error in renderMessage:', error);
      return null;
    }
  };

  return (
    <main className="flex-1 flex flex-col chat-main min-h-0">
      {selectedChat && (
        <div className="p-4 border-bottom-manchat flex items-center justify-between flex-shrink-0 header-main-mess">
          <div className="flex items-center">
            <div
              className="relative"
              onClick={handleGoToProfile}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={selectedChat.avatar || '/default-avatar.png'}
                alt={selectedChat.name}
                className="w-10 h-10 rounded-full "
              />
              {selectedChat.online && (
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-gray-800"></span>
              )}
            </div>
            <div className="ml-4" onClick={handleGoToProfile} style={{ cursor: 'pointer' }}>
              <h2 className="font-semibold text-lg truncate max-w-[200px]">
                {selectedChat.fullname || 'Người dùng'}
              </h2>
              <p className="text-sm text-gray-400">
                {selectedChat.online ? 'Đang hoạt động' : selectedChat.lastSeenText}
              </p>
            </div>
          </div>

          <div className="flex space-x-3 color-svg-top">
            <Call
              senderId={myUserId}
              receiverId={selectedChat?.userId}
              selectedChat={selectedChat}
            />
            <button className="p-2 rounded-full  hover:bg-gray-600 transition-colors">
              <PiDotsThreeBold className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      )}

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 min-h-0 flex flex-col-reverse"
        style={{ scrollBehavior: 'smooth' }}
      >
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8"></div>
          </div>
        ) : (
          <div className="flex flex-col-reverse space-y-reverse space-y-4">
            {Array.isArray(messages) && messages.length > 0 ? (
              [...messages].reverse().map((msg, index) => renderMessage(msg, index))
            ) : (
              <div className="text-center text-gray-400">
                Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="p-4 flex-shrink-0 bottom-send">
        <div className="flex items-end space-x-2">
          <div className="flex space-x-2 color-svg-bottom">
            <button className="p-2 rounded-full hover:bg-gray-700 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-700 transition-colors">
              <CiImageOn className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              className="w-full bg-gray-700 text-white rounded-full px-6 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 input-mess max-h-32 overflow-y-auto"
              style={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word'
              }}
            />
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-600 transition-colors"
            >
              <Smile className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <button
            onClick={handleSend}
            className="text-white rounded-full p-3 focus:outline-none flex-shrink-0 send-mess hover:bg-gray-600"
          >
            {newMessage.trim() ? (
              <RiSendPlane2Fill className="w-5 h-5" />
            ) : (
              <AiFillLike className="w-5 h-5 text-blue-500" />
            )}
          </button>
        </div>
      </div>
    </main>
  );
};