import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchComments, resetComments } from '../../../../../store/features/Comment/Comment';
import './ProfilePost.scss';
import PreviewProfilePost from '../PreviewProfilePost/PreviewProfilePost';
import config from './../../../../../config';
const ProfilePost = ({ profilePicture, username, myUserId, youUserId, isOwnProfiles, userId, fullname }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { postId } = useParams();
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Lấy comments từ Redux store
  const { comments, totalComments } = useSelector((state) => state.comments);

  // Fetch danh sách bài viết của người dùng
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const targetUserId = userId || myUserId;
        if (!targetUserId) throw new Error('User ID not found');

        const response = await fetch(`${config.API_HOST}/api/post/getUserPost/${targetUserId}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to fetch posts');

        const data = await response.json();
        if (data.success) {
          setPosts(data.posts || []);

          // Kiểm tra nếu có postId trong URL
          if (postId) {
            const targetPost = data.posts.find(post => post._id === postId);
            if (targetPost) {
              await fetchGetPost(postId);
            } else {
              navigate(`/error404`);
            }
          }
        } else {
          setError(data.message || 'Failed to fetch posts');
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();

    // Cleanup function để reset comments khi unmount
    return () => {
      dispatch(resetComments());
    };
  }, [userId, myUserId, postId, navigate, dispatch]);

  // Fetch chi tiết bài viết và comments
  const fetchGetPost = async (id) => {
    try {
      // Fetch post details
      const response = await fetch(`${config.API_HOST}/api/post/getPost/${id}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch post details');

      const data = await response.json();
      // console.log(data);
      if (data.success) {
        // Cập nhật selected post với dữ liệu mới nhất

        const updatedPost = {
          ...data.post,
          comments: comments,
          totalComments: totalComments
        };

        setSelectedPost(updatedPost);
        setShowPreviewModal(true);
        // console.log(data.post.comments)

        // Fetch comments mới cho post
        dispatch(fetchComments({ postId: id, sortType: 'intelligent' }));
      } else {
        setError(data.message || 'Failed to fetch post details');
      }
    } catch (error) {
      setError(error.message);
      navigate(`/error404`);
    }
  };

  // Xử lý nhấp vào bài viết
  const handlePostClick = async (post) => {
    await fetchGetPost(post._id);
    navigate(`/profile/${youUserId || myUserId}/post/${post._id}`, { replace: true });
  };

  // Đóng modal xem bài viết và quay lại trang profile
  const handleClosePreviewModal = () => {
    setShowPreviewModal(false);
    setSelectedPost(null);
    dispatch(resetComments());
    navigate(`/profile/${youUserId || myUserId}`, { replace: true });
  };

  // Cập nhật trạng thái thích bài viết
  const handleLikeUpdate = (postId, isLiked) => {
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post._id === postId) {
          const newLikesCount = isLiked
            ? (post.likes?.length || 0) + 1
            : (post.likes?.length || 0) - 1;
          return {
            ...post,
            isLiked: isLiked,
            likes: Array(newLikesCount).fill(null)
          };
        }
        return post;
      })
    );
  };

  // Xử lý xóa bài viết
  const handlePostDelete = (deletedPostId) => {
    setPosts(prevPosts => prevPosts.filter(post => post._id !== deletedPostId));
    handleClosePreviewModal();
  };

  if (loading) {
    return <div className="profile-posts__loading"></div>;
  }

  if (error) {
    return <div className="profile-posts__error">Error: {error}</div>;
  }

  return (
    <div className="profile-posts">
      <div className="profile-posts__grid">
        {posts.map((post) => (
          post && post.img && (
            <div
              key={post._id}
              className="profile-posts__item"
              onClick={() => handlePostClick(post)}
            >
              <img
                src={post.img}
                alt={post.caption || 'Post image'}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/300';
                }}
              />
              <div className="profile-posts__overlay">
                <div className="profile-posts__stats">
                  <span>❤️ {post.likes ? post.likes.length : 0}</span>
                  <span>💭 {post.totalComments}</span>
                </div>
              </div>
            </div>
          )
        ))}
      </div>

      {showPreviewModal && selectedPost && (
        <PreviewProfilePost
          isOpen={showPreviewModal}
          onClose={handleClosePreviewModal}
          post={{
            ...selectedPost,
            comments: comments,
            totalComments: totalComments
          }}
          profilePicture={profilePicture}
          username={username}
          onPostDelete={handlePostDelete}
          onLikeUpdate={handleLikeUpdate}
          isOwnProfile={isOwnProfiles}
          // userId={youUserId || myUserId}
          fullname={fullname}
        />
      )}
    </div>
  );
};

export default ProfilePost;