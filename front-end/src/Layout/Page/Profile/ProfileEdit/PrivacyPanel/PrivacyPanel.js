const PrivacyPanel = () => {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex justify-center min-h-full">
        <div className="w-full max-w-2xl px-8 py-8">
          <h3 className="mb-12 text-xl font-bold">Quyền riêng tư của tài khoản</h3>

          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold">Tài khoản riêng tư</h4>
                  <p className="text-sm text-gray-400">Chỉ những người theo dõi bạn mới có thể xem nội dung của bạn</p>
                </div>
                <div className="w-12 h-6 bg-gray-700 rounded-full relative cursor-pointer">
                  <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <h4 className="font-semibold mb-4">Tương tác</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block">Bình luận</span>
                    <span className="text-sm text-gray-400">Kiểm soát ai có thể bình luận về bài viết của bạn</span>
                  </div>
                  <select className="bg-gray-800 border border-gray-700 rounded p-2">
                    <option>Mọi người</option>
                    <option>Người theo dõi</option>
                    <option>Không ai</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block">Tin nhắn</span>
                    <span className="text-sm text-gray-400">Kiểm soát ai có thể gửi tin nhắn cho bạn</span>
                  </div>
                  <select className="bg-gray-800 border border-gray-700 rounded p-2">
                    <option>Mọi người</option>
                    <option>Người theo dõi</option>
                    <option>Không ai</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PrivacyPanel;