import React, { useState } from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';
import { FaUserCircle } from "react-icons/fa";

export const ChatSidebarRight = ({ selectedChat, userId }) => {
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    if (openSection === section) {
      setOpenSection(null);
    } else {
      setOpenSection(section);
    }
  };

  return (
    <div className="w-80 border-mess-right flex flex-col siderbar-right-mess">
      {selectedChat ? (
        <>
          <div className="p-4 flex flex-col items-center">
            <div className="relative">
              <img
                src={selectedChat.avatar}
                alt={selectedChat.name}
                className="w-20 h-20 rounded-full mb-2"
              />
              <span
                className={`status-indicator ${selectedChat.online ? 'status-online' : 'status-offline'}`}></span>
            </div>
            <h2 className="text-lg font-semibold text-white">{selectedChat.name}</h2>
            <p className="text-sm text-gray-400">
              {selectedChat?.online ? 'Đang hoạt động' : selectedChat?.lastSeenText}
            </p>
          </div>

          <div className="p-4 flex justify-around border-b border-gray-700 color-svg-right">
            <button onClick={() => window.open(`/profile/${userId}`, '_blank')} className="flex flex-col items-center text-gray-300 hover:text-white transition-colors">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-1 hover:bg-gray-600">
                <FaUserCircle className="w-5 h-5" />
              </div>
              <span className="text-xs">Trang cá nhân</span>
            </button>
            <button className="flex flex-col items-center text-gray-300 hover:text-white transition-colors">
              <div className="w-10 h-10  rounded-full flex items-center justify-center mb-1 hover:bg-gray-600">
                <Bell className="w-5 h-5" />
              </div>
              <span className="text-xs">Tắt thông báo</span>
            </button>
            <button className="flex flex-col items-center text-gray-300 hover:text-white transition-colors">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-1 hover:bg-gray-600">
                <Search className="w-5 h-5" />
              </div>
              <span className="text-xs">Tìm kiếm</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto content-right">
            <button
              onClick={() => toggleSection('chatInfo')}
              className="w-full p-4 flex items-center justify-between text-gray-300 hover:bg-gray-700"
            >
              <span className="text-sm font-medium">Thông tin về đoạn chat</span>
              <ChevronDown
                className={`w-5 h-5 transform transition-transform ${openSection === 'chatInfo' ? 'rotate-180' : ''}`}
              />
            </button>
            {openSection === 'chatInfo' && (
              <div className="px-4 py-2 bg-gray-900">
                <p className="text-sm text-gray-400">Các thông tin về đoạn chat</p>
              </div>
            )}

            <button
              onClick={() => toggleSection('chatSettings')}
              className="w-full p-4 flex items-center justify-between text-gray-300 hover:bg-gray-700"
            >
              <span className="text-sm font-medium">Tùy chỉnh đoạn chat</span>
              <ChevronDown
                className={`w-5 h-5 transform transition-transform ${openSection === 'chatSettings' ? 'rotate-180' : ''}`}
              />
            </button>
            {openSection === 'chatSettings' && (
              <div className="px-4 py-2 bg-gray-900">
                <p className="text-sm text-gray-400">Các tùy chỉnh cho đoạn chat</p>
              </div>
            )}

            <button
              onClick={() => toggleSection('files')}
              className="w-full p-4 flex items-center justify-between text-gray-300 hover:bg-gray-700"
            >
              <span className="text-sm font-medium">File phương tiện & file</span>
              <ChevronDown
                className={`w-5 h-5 transform transition-transform ${openSection === 'files' ? 'rotate-180' : ''}`}
              />
            </button>
            {openSection === 'files' && (
              <div className="px-4 py-2 bg-gray-900">
                <p className="text-sm text-gray-400">Danh sách file được chia sẻ</p>
              </div>
            )}

            <button
              onClick={() => toggleSection('privacy')}
              className="w-full p-4 flex items-center justify-between text-gray-300 hover:bg-gray-700"
            >
              <span className="text-sm font-medium">Quyền riêng tư & hỗ trợ</span>
              <ChevronDown
                className={`w-5 h-5 transform transition-transform ${openSection === 'privacy' ? 'rotate-180' : ''}`}
              />
            </button>
            {openSection === 'privacy' && (
              <div className="px-4 py-2 bg-gray-900">
                <p className="text-sm text-gray-400">Cài đặt quyền riêng tư và trợ giúp</p>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};