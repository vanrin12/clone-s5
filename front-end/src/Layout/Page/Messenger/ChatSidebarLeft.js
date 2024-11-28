import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import config from './../../../config';

export const ChatSidebarLeft = ({
  onlineUsers,
  receiverId,
  handleUserSelect,
  myUserId,
  conversationList,
  userStatuses,
  // onSearch
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isInitialSelected, setIsInitialSelected] = useState(false);
  const [allMessages, setAllMessages] = useState({});

  useEffect(() => {
    if (!isInitialSelected && conversationList.length > 0) {
      handleUserSelect(conversationList[0].member._id);
      setIsInitialSelected(true);
    }
  }, [conversationList, isInitialSelected, handleUserSelect]);

  // Fetch messages for all conversations
  const fetchAllMessages = async (userId) => {
    try {
      const response = await fetch(`${config.API_HOST}/api/message/getMess/${userId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data?.messages)) {
          return data.messages.map(msg => ({
            _id: msg._id,
            message: typeof msg.message === 'object' ? JSON.stringify(msg.message) : msg.message,
            senderId: typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId,
            receiverId: typeof msg.receiverId === 'object' ? msg.receiverId._id : msg.receiverId,
            timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
          }));
        }
      }
      return [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  };

  // Load all messages initially
  useEffect(() => {
    const loadAllMessages = async () => {
      const messagesMap = {};
      for (const conv of conversationList) {
        const messages = await fetchAllMessages(conv.member._id);
        messagesMap[conv.member._id] = messages;
      }
      setAllMessages(messagesMap);
    };

    if (conversationList.length > 0) {
      loadAllMessages();
    }
  }, [conversationList]);

  // Format time function
  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';

    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - messageDate) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút`;
    if (diffInHours < 24) return `${diffInHours} giờ`;
    if (diffInDays < 7) return `${diffInDays} ngày`;
    return messageDate.toLocaleDateString('vi-VN');
  };

  // Search users function
  const searchUsers = async (keyword) => {
    if (!keyword.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `${config.API_HOST}/api/message/Search?keyword=${encodeURIComponent(keyword)}`,
        {
          method: 'GET',
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.users) {
          setSearchResults(data.users);
        }
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    }
  };

  const handleSearchUserSelect = async (user) => {
    // Kiểm tra xem user đã có trong conversationList chưa
    const existingConversation = conversationList.find(conv => conv.member._id === user._id);

    if (!existingConversation) {
      // Nếu là người dùng mới từ tìm kiếm, thêm vào đầu danh sách conversation
      const newConversation = {
        member: {
          _id: user._id,
          username: user.username,
          fullname: user.fullname,
          profilePicture: user.profilePicture || '/default-avatar.png'
        },
        lastMessageTime: new Date().toISOString()
      };

      // Thêm conversation mới vào đầu danh sách
      conversationList.unshift(newConversation);
    }

    // Xóa kết quả tìm kiếm và search term
    setSearchTerm('');
    setSearchResults([]);

    // Gọi handleUserSelect từ props
    handleUserSelect(user._id);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim()) {
        searchUsers(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Get last message for a user
  const getLastMessage = (userId) => {
    const userMessages = allMessages[userId] || [];
    if (userMessages.length === 0) return null;

    return userMessages.sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    )[0];
  };

  const renderUserItem = (user, isFromSearch = false) => {
    const userId = user._id;
    const isOnline = onlineUsers.includes(userId);
    const lastMessage = !isFromSearch ? getLastMessage(userId) : null;

    return (
      <div
        key={userId}
        onClick={() => isFromSearch ? handleSearchUserSelect(user) : handleUserSelect(userId)}
        className={`p-2 hover:bg-[#3a3344] cursor-pointer ${receiverId === userId ? 'bg-gray-800' : ''}`}
        style={{ borderRadius: "10px" }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={user.profilePicture || '/default-avatar.png'}
              alt={user.username}
              className="w-12 h-12 rounded-full"
            />
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-gray-900" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-100">{user.username}</p>
            <div className="flex items-center gap-2 truncate">
              <p className="text-sm text-gray-400 truncate flex-shrink">
                {lastMessage && (
                  lastMessage.senderId === myUserId ?
                    `Bạn: ${lastMessage.message}` :
                    lastMessage.message
                )}
              </p>
              {lastMessage && (
                <span className="text-xs text-gray-500 flex-shrink-0">
                  • {formatLastMessageTime(lastMessage.timestamp)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-80 border-mess-left flex flex-col left-mess">
      <div className="p-4 flex items-center justify-between ">
        <h1 className="text-xl font-semibold text-gray-100">Đoạn chat</h1>
      </div>

      <div className="px-4 pb-2 pt-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm trên Messenger"
            className="w-full bg-gray-800 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none text-gray-100 input-search"
          />
        </div>
      </div>

      <div className="flex  px-4">
        <button className="flex-1 py-3 text-blue-500 border-b-2 border-blue-500">
          Hộp thư
        </button>
        <button className="flex-1 py-3 text-gray-400">
          Cộng đồng
        </button>
      </div>

      <div className="flex-1 overflow-y-auto content-left" style={{ padding: "10px" }}>
        {searchTerm && searchResults.length > 0 ? (
          searchResults.map(user => renderUserItem(user, true))
        ) : searchTerm && searchResults.length === 0 ? (
          <div className="text-gray-400 p-4">Không tìm thấy kết quả</div>
        ) : conversationList.length > 0 ? (
          conversationList.map(conv => renderUserItem(conv.member))
        ) : (
          <div className="text-gray-400 p-4">Không có cuộc trò chuyện nào</div>
        )}
      </div>
    </div>
  );
};