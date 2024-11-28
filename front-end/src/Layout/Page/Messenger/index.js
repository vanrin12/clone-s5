import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { ChatSidebarLeft } from './ChatSidebarLeft';
import { ChatSidebarRight } from './ChatSidebarRight';
import { ChatMain } from './ChatMain';
import "./messenger.scss"
import config from './../../../config';

const MessengerLayout = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [chatUsers, setChatUsers] = useState({});
  const [conversationList, setConversationList] = useState([]);
  const [userStatuses, setUserStatuses] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const myUserId = localStorage.getItem('_id');
  const socketRef = useRef();
  const [instantMessages, setInstantMessages] = useState({});

  // Kết nối Socket.IO
  useEffect(() => {
    if (!myUserId) return;

    const connectSocket = () => {
      try {
        const newSocket = io(`${config.API_HOST}`, {
          query: { userId: myUserId },
          autoConnect: true,
          // transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        // Xử lý các sự kiện socket
        newSocket.on('connect', () => {
          // console.log('Socket connected:', newSocket.id);
          setLoading(false);
        });

        newSocket.on('newMessage', handleNewMessage);
        newSocket.on('getOnlineUsers', handleOnlineUsers);
        newSocket.on('messagesRead', handleMessagesRead);

        newSocket.on('disconnect', () => {
          // console.log('Socket disconnected');
          setLoading(true);
        });

        newSocket.on('connect_error', (error) => {
          // console.error('Socket connection error:', error);
          setLoading(true);
        });

        return newSocket;
      } catch (error) {
        console.error('Socket initialization error:', error);
        setLoading(false);
        return null;
      }
    };

    const socket = connectSocket();

    return () => {
      if (socket) {
        socket.off('newMessage');
        socket.off('getOnlineUsers');
        socket.off('messagesRead');
        socket.disconnect();
      }
    };
  }, [myUserId]);

  const getLastSeenText = (lastActiveAt) => {
    if (!lastActiveAt) return 'Không hoạt động';

    const now = new Date();
    const lastActive = new Date(lastActiveAt);
    const diffInSeconds = Math.floor((now - lastActive) / 1000);

    if (diffInSeconds < 60) {
      return 'Vừa truy cập';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `Hoạt động ${diffInMinutes} phút trước`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `Hoạt động ${diffInHours} giờ trước`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
      return 'Hoạt động từ hôm qua';
    }
    if (diffInDays < 7) {
      return `Không hoạt động ${diffInDays} ngày trước`;
    }

    return `Hoạt động cuối ${lastActive.toLocaleDateString('vi-VN')}`;
  };

  const fetchUserStatuses = async () => {
    try {
      const response = await fetch(`${config.API_HOST}/api/message/person`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.conversations) {
          const newStatuses = {};
          data.conversations.forEach(conv => {
            if (conv.member && conv.member._id) {
              newStatuses[conv.member._id] = {
                lastActiveAt: conv.lastActiveAt,
                online: onlineUsers.includes(conv.member._id),
                lastSeenText: conv.lastActiveAt ? getLastSeenText(conv.lastActiveAt) : 'Không hoạt động'
              };
            }
          });
          setUserStatuses(newStatuses);

          // Update selectedChat if it exists
          if (selectedChat && newStatuses[selectedChat.userId]) {
            setSelectedChat(prev => ({
              ...prev,
              online: newStatuses[selectedChat.userId].online,
              lastActiveAt: newStatuses[selectedChat.userId].lastActiveAt,
              lastSeenText: newStatuses[selectedChat.userId].lastSeenText
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user statuses:', error);
    }
  };

  const sendQuickIcon = async (icon = '👍') => {
    if (!receiverId || !socket) return;

    const tempMessageId = new Date().getTime().toString();
    const currentTime = new Date().toISOString();

    const tempMessage = {
      _id: tempMessageId,
      message: icon,
      senderId: myUserId,
      receiverId,
      timestamp: currentTime,
      pending: true
    };

    // Update both messages and instantMessages
    setMessages(prev => [...prev, tempMessage]);
    setInstantMessages(prev => ({
      ...prev,
      [receiverId]: [...(prev[receiverId] || []), tempMessage]
    }));

    try {
      const response = await fetch(`${config.API_HOST}/api/message/send/${receiverId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ message: icon }),
      });

      const data = await response.json();

      if (data.success && data.message) {
        const confirmedMessage = {
          _id: data.message._id,
          message: icon,
          senderId: myUserId,
          receiverId,
          timestamp: data.message.timestamp || data.message.createdAt || currentTime,
          pending: false
        };

        // Update both states with confirmed message
        setMessages(prev =>
          prev.map(msg => msg._id === tempMessageId ? confirmedMessage : msg)
        );

        setInstantMessages(prev => ({
          ...prev,
          [receiverId]: prev[receiverId].map(msg =>
            msg._id === tempMessageId ? confirmedMessage : msg
          )
        }));

        // Emit socket event
        socket.emit('sendMessage', {
          ...data.message,
          senderId: myUserId,
          receiverId,
          message: icon
        });

        // Update conversation list
        setConversationList(prev => {
          const updatedList = prev.map(conv => {
            if (conv.member._id === receiverId) {
              return {
                ...conv,
                lastMessage: icon,
                lastMessageTime: data.message.timestamp || data.message.createdAt || currentTime,
                pending: false
              };
            }
            return conv;
          });

          return [
            ...updatedList.filter(conv => conv.member._id === receiverId),
            ...updatedList.filter(conv => conv.member._id !== receiverId)
          ];
        });

      } else {
        handleMessageFailure(tempMessageId, receiverId);
      }
    } catch (error) {
      console.error('Error sending quick icon:', error);
      handleMessageFailure(tempMessageId, receiverId);
    }
  };

  // Effect to fetch user statuses periodically
  useEffect(() => {
    if (myUserId) {
      fetchUserStatuses();
      const interval = setInterval(fetchUserStatuses, 30000);
      return () => clearInterval(interval);
    }
  }, [myUserId, onlineUsers]);

  // Thêm function này sau các function hiện có
  const fetchConversationList = async () => {
    try {
      const response = await fetch(`${config.API_HOST}/api/message/person`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.conversations) {
          // Sắp xếp conversations theo thời gian mới nhất
          const sortedConversations = data.conversations.sort((a, b) =>
            new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
          );

          // Cập nhật danh sách người trò chuyện
          setConversationList(sortedConversations);

          // Cập nhật thông tin người dùng vào chatUsers và thời gian
          sortedConversations.forEach(conv => {
            if (conv.member) {
              // Cập nhật thông tin người dùng
              setChatUsers(prev => ({
                ...prev,
                [conv.member._id]: {
                  username: conv.member.username,
                  fullname: conv.member.fullname,
                  profilePicture: conv.member.profilePicture || '/default-avatar.png',
                  lastMessageTime: conv.lastMessageTime,
                  _id: conv.member._id
                }
              }));

              // Thêm lastSeen nếu có
              if (conv.member.lastSeen) {
                setChatUsers(prev => ({
                  ...prev,
                  [conv.member._id]: {
                    ...prev[conv.member._id],
                    lastSeen: conv.member.lastSeen
                  }
                }));
              }

              // Thêm lastMessage nếu có
              if (conv.lastMessage) {
                setChatUsers(prev => ({
                  ...prev,
                  [conv.member._id]: {
                    ...prev[conv.member._id],
                    lastMessage: conv.lastMessage
                  }
                }));
              }
            }
          });

          // Khởi tạo states cho tin nhắn chưa đọc nếu cần
          if (data.unreadCounts) {
            const unreadCountsMap = {};
            data.unreadCounts.forEach(item => {
              unreadCountsMap[item.userId] = item.count;
            });
            setUnreadCounts(unreadCountsMap);
          }
        }
      } else {
        console.error('Failed to fetch conversation list:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching conversation list:', error);
    }
  };

  // Thêm useEffect này để fetch danh sách khi component mount
  useEffect(() => {
    if (myUserId) {
      fetchConversationList();
    }
  }, [myUserId]);

  // Xử lý tin nhắn mới
  const handleNewMessage = (msg) => {
    try {
      let messageContent = msg.message;
      if (typeof msg.message === 'string' && msg.message.startsWith('{')) {
        try {
          const parsedMessage = JSON.parse(msg.message);
          messageContent = parsedMessage.message || msg.message;
        } catch (e) {
          messageContent = msg.message;
        }
      }

      const formattedMessage = {
        _id: msg._id || new Date().getTime().toString(),
        message: messageContent,
        senderId: typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId,
        receiverId: typeof msg.receiverId === 'object' ? msg.receiverId._id : msg.receiverId,
        timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
      };

      // Update instantMessages
      setInstantMessages(prev => {
        const chatId = formattedMessage.senderId === myUserId ?
          formattedMessage.receiverId :
          formattedMessage.senderId;

        const existingMessages = prev[chatId] || [];
        const messageExists = existingMessages.some(m => m._id === formattedMessage._id);

        if (!messageExists) {
          return {
            ...prev,
            [chatId]: [...existingMessages, formattedMessage].sort(
              (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
            )
          };
        }
        return prev;
      });

      // Also update messages if it's the current chat
      setMessages(prev => {
        const isCurrentChat =
          (receiverId === formattedMessage.senderId || receiverId === formattedMessage.receiverId) &&
          (formattedMessage.senderId === myUserId || formattedMessage.receiverId === myUserId);

        if (isCurrentChat && !prev.some(m => m._id === formattedMessage._id)) {
          return [...prev, formattedMessage];
        }
        return prev;
      });

      // Update conversation list
      setConversationList(prev => {
        const otherUserId = formattedMessage.senderId === myUserId ?
          formattedMessage.receiverId :
          formattedMessage.senderId;

        const updatedList = prev.map(conv => {
          if (conv.member._id === otherUserId) {
            const currentLastMessageTime = new Date(conv.lastMessageTime);
            const newMessageTime = new Date(formattedMessage.timestamp);

            if (newMessageTime > currentLastMessageTime) {
              return {
                ...conv,
                lastMessage: messageContent,
                lastMessageTime: formattedMessage.timestamp
              };
            }
          }
          return conv;
        });

        // Move updated conversation to top
        return [
          ...updatedList.filter(conv => conv.member._id === otherUserId),
          ...updatedList.filter(conv => conv.member._id !== otherUserId)
        ];
      });

      // Update user info if needed
      if (msg.senderId && typeof msg.senderId === 'object') {
        updateChatUser(msg.senderId);
      }
      if (msg.receiverId && typeof msg.receiverId === 'object') {
        updateChatUser(msg.receiverId);
      }
    } catch (error) {
      console.error('Error handling new message:', error);
    }
  };

  // Xử lý danh sách người dùng trực tuyến
  const handleOnlineUsers = (users) => {
    try {
      // console.log('Online users:', users);
      setOnlineUsers(users);

      // Tải tin nhắn cho mỗi người dùng trực tuyến
      users.forEach(userId => {
        if (userId !== myUserId) {
          fetchUserInfo(userId);
        }
      });
    } catch (error) {
      console.error('Error handling online users:', error);
    }
  };

  // Xử lý đánh dấu tin nhắn đã đọc
  const handleMessagesRead = ({ conversationId, readBy }) => {
    try {
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.conversationId === conversationId ? { ...msg, read: true } : msg
        )
      );
    } catch (error) {
      console.error('Error handling messages read:', error);
    }
  };

  // Cập nhật thông tin người dùng
  const updateChatUser = async (userInfo) => {
    if (!userInfo || (!userInfo._id && !userInfo.id)) return;

    const userId = userInfo._id || userInfo.id;
    if (chatUsers[userId]) return;

    setChatUsers(prev => ({
      ...prev,
      [userId]: {
        username: userInfo.username,
        fullname: userInfo.fullname,
        profilePicture: userInfo.profilePicture || '/default-avatar.png',
      }
    }));
  };
  // Thêm useEffect để cập nhật trạng thái online
  useEffect(() => {
    const updateOnlineStatus = () => {
      setConversationList(prev =>
        prev.map(conv => ({
          ...conv,
          member: {
            ...conv.member,
            online: onlineUsers.includes(conv.member._id),
            lastSeenText: userStatuses[conv.member._id]?.lastSeenText
          }
        }))
      );
    };

    updateOnlineStatus();
  }, [onlineUsers, userStatuses]);
  // Lấy thông tin người dùng
  const fetchUserInfo = async (userId) => {
    try {
      const response = await fetch(`${config.API_HOST}/api/message/getMess/${userId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.conversation?.members) {
          const member = data.conversation.members.find(m => m._id === userId);
          if (member) {
            updateChatUser(member);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  // Lấy tin nhắn của một cuộc trò chuyện
  const fetchMessages = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_HOST}/api/message/getMess/${userId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data?.messages)) {
          // Format tin nhắn
          const formattedMessages = data.messages.map(msg => ({
            _id: msg._id,
            message: typeof msg.message === 'object' ? JSON.stringify(msg.message) : msg.message,
            senderId: typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId,
            receiverId: typeof msg.receiverId === 'object' ? msg.receiverId._id : msg.receiverId,
            timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
          }));

          // Cập nhật cả messages và instantMessages
          setMessages(formattedMessages);
          setInstantMessages(prev => ({
            ...prev,
            [userId]: formattedMessages
          }));

          // Cập nhật thông tin người dùng từ tin nhắn
          data.messages.forEach(msg => {
            if (msg.senderId) updateChatUser(msg.senderId);
            if (msg.receiverId) updateChatUser(msg.receiverId);
          });
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi chọn người dùng để chat
  const handleUserSelect = async (userId) => {
    setReceiverId(userId);
    await fetchMessages(userId);

    // Lấy thông tin người dùng từ các nguồn khác nhau
    const userInfo =
      searchResults.find(user => user._id === userId) ||
      conversationList.find(conv => conv.member._id === userId)?.member ||
      chatUsers[userId];

    if (userInfo) {
      // Cập nhật selectedChat với thông tin user và trạng thái online
      setSelectedChat({
        userId,
        username: userInfo.username,
        avatar: userInfo.profilePicture || '/default-avatar.png',
        fullname: userInfo.fullname,
        online: onlineUsers.includes(userId),
        lastActiveAt: userStatuses[userId]?.lastActiveAt,
        lastSeenText: getLastSeenText(userStatuses[userId]?.lastActiveAt)
      });

      // Nếu user từ search results, thêm vào conversationList
      if (!conversationList.find(conv => conv.member._id === userId)) {
        const newConversation = {
          member: {
            _id: userId,
            username: userInfo.username,
            fullname: userInfo.fullname,
            profilePicture: userInfo.profilePicture
          },
          lastMessageTime: new Date().toISOString()
        };

        setConversationList(prev => [newConversation, ...prev]);
      }
    }
  };

  // Gửi tin nhắn
  const sendMessage = async () => {
    if (!receiverId || !newMessage.trim() || !socket) return;

    const tempMessageId = new Date().getTime().toString();
    const currentTime = new Date().toISOString();
    const messageContent = newMessage.trim();

    if (messageContent === newMessage) {
      setNewMessage('');
    }

    const tempMessage = {
      _id: tempMessageId,
      message: messageContent,
      senderId: myUserId,
      receiverId,
      timestamp: currentTime,
      pending: true
    };

    // Update both messages and instantMessages
    setMessages(prev => [...prev, tempMessage]);
    setInstantMessages(prev => ({
      ...prev,
      [receiverId]: [...(prev[receiverId] || []), tempMessage]
    }));

    try {
      const response = await fetch(`${config.API_HOST}/api/message/send/${receiverId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ message: messageContent }),
      });

      const data = await response.json();

      if (data.success && data.message) {
        const confirmedMessage = {
          _id: data.message._id,
          message: messageContent,
          senderId: myUserId,
          receiverId,
          timestamp: data.message.timestamp || data.message.createdAt || currentTime,
          pending: false
        };

        // Update both states with confirmed message
        setMessages(prev =>
          prev.map(msg => msg._id === tempMessageId ? confirmedMessage : msg)
        );

        setInstantMessages(prev => ({
          ...prev,
          [receiverId]: prev[receiverId].map(msg =>
            msg._id === tempMessageId ? confirmedMessage : msg
          )
        }));

        // Emit socket event
        socket.emit('sendMessage', {
          ...data.message,
          senderId: myUserId,
          receiverId,
          message: messageContent
        });

        // Update conversation list
        setConversationList(prev => {
          const updatedList = prev.map(conv => {
            if (conv.member._id === receiverId) {
              return {
                ...conv,
                lastMessage: messageContent,
                lastMessageTime: data.message.timestamp || data.message.createdAt || currentTime,
                pending: false
              };
            }
            return conv;
          });

          return [
            ...updatedList.filter(conv => conv.member._id === receiverId),
            ...updatedList.filter(conv => conv.member._id !== receiverId)
          ];
        });

      } else {
        handleMessageFailure(tempMessageId, receiverId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      handleMessageFailure(tempMessageId, receiverId);
    }
  };

  // Modified handleMessageFailure
  const handleMessageFailure = (tempMessageId, chatId) => {
    // Remove failed message from both states
    setMessages(prev => prev.filter(msg => msg._id !== tempMessageId));
    setInstantMessages(prev => ({
      ...prev,
      [chatId]: prev[chatId].filter(msg => msg._id !== tempMessageId)
    }));

    // Restore conversation list
    setConversationList(prev => {
      return prev.map(conv => {
        if (conv.member._id === chatId && conv.pending) {
          const lastSuccessfulMessage = messages
            .filter(msg => !msg.pending)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

          return {
            ...conv,
            lastMessage: lastSuccessfulMessage?.message || conv.lastMessage,
            lastMessageTime: lastSuccessfulMessage?.timestamp || conv.lastMessageTime,
            pending: false
          };
        }
        return conv;
      });
    });
  };

  // Xử lý nhập tin nhắn
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
  };

  // search userMess
  const searchUsers = async (keyword) => {
    if (!keyword.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `${config.API_HOST}/api/message/Search?keyword=${encodeURIComponent(keyword)}`, // Sửa từ messages thành message
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

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <ChatSidebarLeft
        onlineUsers={onlineUsers}
        chatUsers={chatUsers}
        receiverId={receiverId}
        handleUserSelect={handleUserSelect}
        myUserId={myUserId}
        conversationList={conversationList}
        unreadCounts={unreadCounts}
        messages={instantMessages[receiverId] || messages}
        userStatuses={userStatuses}
        onSearch={searchUsers}
      />

      <ChatMain
        selectedChat={selectedChat}
        loading={loading}
        messages={instantMessages[receiverId] || messages}
        myUserId={myUserId}
        newMessage={newMessage}
        handleTyping={handleTyping}
        sendMessage={sendMessage}
        userId={receiverId}
        userStatus={userStatuses[receiverId]}
        sendQuickIcon={sendQuickIcon}
      />

      <ChatSidebarRight
        selectedChat={selectedChat}
        userId={receiverId}
        userStatus={userStatuses[receiverId]}
      />
    </div>
  );
};

export default MessengerLayout;