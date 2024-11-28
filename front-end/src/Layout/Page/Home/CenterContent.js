import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Image, Smile, UserPlus } from 'lucide-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import UploadModal from './../../../Components/UploadModal/index';
import { fetchProfileData } from './../../../store/features/profile/profileSlice';
import { useNavigate } from 'react-router-dom';

export const CenterContent = ({
  postText,
  setPostText,
  storyPage,
  nextStoryPage,
  prevStoryPage,
  stories,
  storiesPerPage,
  posts
}) => {
  // State cho UploadModal
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const { profileData } = useSelector((state) => state.profile);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userId = profileData?._id;
  const fullname = profileData?.fullname;
  const [fullNameCaption, setFullnameCaption] = useState(fullname);

  useEffect(() => {
    const fetchData = async () => {
      const myUserId = localStorage.getItem('_id');
      if (myUserId) {
        try {
          await dispatch(fetchProfileData({ myUserId }));
        } catch (error) {
          console.error("Error fetching initial data:", error);
        }
      }
    };
    fetchData();
  }, [dispatch]);

  useEffect(() => {
    if (fullname) {
      const lastName = fullname ? fullname.split(' ').slice(-1)[0] : '';
      setFullnameCaption(`${lastName} ơi, bạn đang nghĩ gì thế?`);
    }
  }, [fullname]);

  const handleGoToProfile = () => {
    navigate(`/profile/${userId}`);
  };

  const handleUploadSuccess = (newPost) => {
    // console.log('New post created:', newPost);
    posts.unshift(newPost);
    setUploadModalOpen(false);
  };

  const handleOpenUploadModal = () => {
    setUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    setUploadModalOpen(false);
  };

  return (
    <div className="flex-1 w-full flex justify-center main-center">
      {/* Modal Upload */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={handleCloseUploadModal}
        onUploadSuccess={handleUploadSuccess}
        profilePicture={profileData?.profilePicture || 'default-avatar.png'}
        username={profileData?.username || 'Ẩn danh'}
        fullname={profileData?.fullname || 'Người dùng'}
      />

      {/* Main Content */}
      <div className="w-[600px] overflow-y-auto pb-8 main-home">
        <div className="p-4">
          {/* Create Post Section */}
          <div className="mb-4">
            <div className="w-full tin-home rounded-lg p-4">
              <div style={{ cursor: "pointer" }} className="flex items-center space-x-3 mb-4">
                <div onClick={handleGoToProfile} className="w-10 h-10 bg-gray-700 rounded-full">
                  <img
                    src={profileData?.profilePicture || 'default-avatar.png'}
                    alt=""
                    className="rounded-full"
                  />
                </div>
                <input
                  onClick={handleOpenUploadModal}
                  style={{ backgroundColor: "#111", cursor: "pointer" }}
                  type="text"
                  placeholder={fullNameCaption}
                  className="flex-1 bg-gray-700 rounded-full px-4 py-3 focus:outline-none"
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  readOnly
                />
              </div>
              <div className="border-t border-gray-700 pt-4">
                <div className="flex justify-between">
                  <button
                    className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-700 rounded-lg"
                    onClick={handleOpenUploadModal}
                  >
                    <Image size={20} className="text-green-500" />
                    <span>Ảnh/video</span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-700 rounded-lg">
                    <UserPlus size={20} className="text-blue-500" />
                    <span>Gắn thẻ người khác</span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-700 rounded-lg">
                    <Smile size={20} className="text-yellow-500" />
                    <span>Cảm xúc/hoạt động</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stories Section */}
          <div className="relative mb-4">
            <div className="relative">
              {storyPage > 0 && (
                <button
                  style={{ backgroundColor: "#333" }}
                  onClick={prevStoryPage}
                  className="absolute left-12 top-1/2 transform -translate-y-1/2 -translate-x-10 bg-gray-700 rounded-full p-1 hover:bg-gray-600 "
                >
                  <ChevronLeft size={20} />
                </button>
              )}

              <div className="flex space-x-2">
                <div
                  className="flex-shrink-0 w-24 h-40 rounded-lg flex flex-col items-center justify-center"
                  style={{ backgroundColor: "#111" }}
                >
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mb-2">
                    <span className="text-2xl">+</span>
                  </div>
                  <span className="text-sm">Tạo tin</span>
                </div>

                <div className="flex space-x-2 overflow-x-hidden">
                  {stories
                    .slice(
                      storyPage * storiesPerPage,
                      (storyPage + 1) * storiesPerPage
                    )
                    .map((_, index) => (
                      <div
                        style={{ backgroundColor: "#111" }}
                        key={storyPage * storiesPerPage + index}
                        className="flex-shrink-0 w-24 h-40 bg-gray-800 rounded-lg"
                      />
                    ))}
                </div>
              </div>

              {(storyPage + 1) * storiesPerPage < stories.length && (
                <button
                  style={{ backgroundColor: "#333" }}
                  onClick={nextStoryPage}
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 translate-x-10 bg-gray-700 rounded-full p-1 hover:bg-gray-600 "
                >
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Posts Section */}
          <div>
            {posts.map((post) => (
              <div
                key={post.id}
                className="rounded-lg mb-4 post-home"
                style={{ backgroundColor: "#111", overflow: "hidden" }}
              >
                <div className="p-4 flex items-center">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-700 rounded-full mr-3"></div>
                    <div>
                      <div className="font-medium">{post.author}</div>
                      <div className="text-gray-400 text-sm">{post.timeAgo}</div>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-2 whitespace-pre-line">
                  {post.content}
                </div>

                <div className="w-full overflow-hidden image-post">
                  <div className="custom-images-post">
                    <img
                      src={post.imageUrl}
                      alt="Post content"
                      className="w-full h-auto"
                    />
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span>😂</span>
                      <span>👍</span>
                      <span>😢</span>
                      <span className="text-gray-400">
                        {post.reactions?.likes ? `${post.reactions.likes} người khác` : 'Không có lượt thích'}
                      </span>
                    </div>
                    <div className="text-gray-400 pb-2 flex justify-between gap-4">
                      <div>
                        {post.reactions?.comments ? `${post.reactions.comments} bình luận ` : ' '}
                      </div>
                      <div>
                        {post.reactions?.shares ? `${post.reactions.shares} lượt chia sẻ` : ' '}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between border-t border-gray-700 pt-2">
                    <button className="flex-1 text-center py-2 hover:bg-gray-700 rounded">
                      Thích
                    </button>
                    <button className="flex-1 text-center py-2 hover:bg-gray-700 rounded">
                      Bình luận
                    </button>
                    <button className="flex-1 text-center py-2 hover:bg-gray-700 rounded">
                      Chia sẻ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
