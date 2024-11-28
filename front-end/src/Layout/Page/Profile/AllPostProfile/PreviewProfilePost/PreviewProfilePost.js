import React, { useState, useEffect, useRef } from 'react';
import { MoreHorizontal, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchComments, addComment, replyComment } from '../../../../../store/features/Comment/Comment';
import { fetchProfileData } from './../../../../../store/features/profile/profileSlice';
import EditPreviewProfilePost from './../EditPreviewProfilePost/index';
import LikeUnlike from './../../../../../Components/LikeUnlike/index';
import { RenderComment } from "./RenderComment"
import { CommentInput } from "./RenderCommentInput"
import { formatTime } from './formatTime';
import "./PreviewProfilePost.scss"

const PreviewProfilePost = ({
  isOpen,
  onClose,
  post,
  profilePicture,
  username,
  onPostDelete,
  onLikeUpdate,
  isOwnProfile,
  // userId,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const dispatch = useDispatch();
  const { profileData } = useSelector((state) => state.profile);
  const { comments, loading } = useSelector((state) => state.comments);
  const commentsContainerRef = useRef(null);
  const [optimisticComments, setOptimisticComments] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [lastCommentId, setLastCommentId] = useState(null);
  const userId = localStorage.getItem('_id');


  const handleUserClick = (userId) => {
    onClose();
    setTimeout(() => {
      window.location.href = `/profile/${userId}`;
    }, 100);
  };

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      const myUserId = localStorage.getItem('_id');
      if (myUserId && post._id && isOpen) {
        try {
          await Promise.all([
            dispatch(fetchProfileData({ myUserId })),
            dispatch(fetchComments({ postId: post._id }))
          ]);
        } catch (error) {
          console.error("Error fetching initial data:", error);
        }
      }
    };


    if (isOpen && isInitialLoad) {
      fetchData();
      setIsInitialLoad(false);
    }
  }, [dispatch, post._id, isOpen, isInitialLoad]);

  // Update optimistic comments and handle scrolling when comments change
  useEffect(() => {
    if (comments) {
      setOptimisticComments(comments);

      // Scroll to the new comment if it exists
      if (lastCommentId && commentsContainerRef.current) {
        const newCommentElement = document.getElementById(lastCommentId);
        if (newCommentElement) {
          newCommentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setLastCommentId(null); // Reset after scrolling
        }
      }
    }
  }, [comments, lastCommentId]);

  useEffect(() => {
    if (comments && comments.length > 0) {
      setOptimisticComments(comments);
    }
  }, [comments]);

  // Thêm effect để reload comments khi có thay đổi
  useEffect(() => {
    const fetchData = async () => {
      if (post._id && isOpen) {
        try {
          await dispatch(fetchComments({
            postId: post._id,
            forceRefresh: true
          }));
        } catch (error) {
          console.error("Error fetching comments:", error);
        }
      }
    };

    fetchData();
  }, [dispatch, post._id, isOpen]);

  // Handle comment submission with optimistic updates
  const handleSubmitComment = async (commentText) => {
    const myUserId = localStorage.getItem('_id');
    if (!myUserId || !commentText.trim()) return;

    const tempId = `temp-${Date.now()}`;
    // Create optimistic comment
    const optimisticComment = {
      _id: tempId,
      text: commentText,
      author: {
        _id: myUserId,
        username: profileData.username,
        profilePicture: profileData.profilePicture
      },
      createdAt: new Date().toISOString(),
      likes: [],
      replies: []
    };

    // Add optimistic comment to state
    setOptimisticComments(prev => [optimisticComment, ...prev]);
    setLastCommentId(tempId);

    try {
      // Submit comment to server
      const result = await dispatch(addComment({
        postId: post._id,
        text: commentText,
        parentId: null,
        userId: myUserId
      })).unwrap();

      // Update lastCommentId with the real ID from the server
      setLastCommentId(result.comment._id);

      // Fetch latest comments to ensure consistency
      await dispatch(fetchComments({ postId: post._id }));
    } catch (error) {
      console.error("Error adding comment:", error);
      // Remove optimistic comment on error
      setOptimisticComments(prev =>
        prev.filter(comment => comment._id !== tempId)
      );
      setLastCommentId(null);
    }
  };

  // Handle reply comment
  const handleReplyComment = async (commentId, replyText) => {
    const myUserId = localStorage.getItem('_id');
    if (!myUserId || !replyText.trim()) return;

    const tempId = `temp-reply-${Date.now()}`;

    // Create optimistic reply với đầy đủ thông tin cần thiết
    const optimisticReply = {
      _id: tempId,
      text: replyText,
      author: {
        _id: myUserId,
        username: profileData.username,
        profilePicture: profileData.profilePicture,
        fullname: profileData.fullname,
        reputation: profileData.reputation
      },
      parentId: commentId,
      createdAt: new Date().toISOString(),
      likes: [],
      post: post._id
    };

    // Thêm vào state ngay lập tức
    setOptimisticComments(prev => prev.map(comment => {
      if (comment._id === commentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), optimisticReply]
        };
      }
      return comment;
    }));

    try {
      // Gửi reply lên server
      const result = await dispatch(replyComment({
        postId: post._id,
        commentId: commentId,
        text: replyText
      })).unwrap();

      // Cập nhật state với ID thật từ server
      setOptimisticComments(prev => prev.map(comment => {
        if (comment._id === commentId) {
          return {
            ...comment,
            replies: comment.replies.map(reply =>
              reply._id === tempId ? { ...result.reply, parentId: commentId } : reply
            )
          };
        }
        return comment;
      }));

    } catch (error) {
      console.error("Error adding reply:", error);
      // Xóa optimistic reply nếu có lỗi
      setOptimisticComments(prev => prev.map(comment => {
        if (comment._id === commentId) {
          return {
            ...comment,
            replies: comment.replies.filter(reply => reply._id !== tempId)
          };
        }
        return comment;
      }));
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      // Reset states when modal closes
      setIsInitialLoad(true);
      setOptimisticComments([]);
      setLastCommentId(null);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !post) return null;

  const handleMoreOptionsClick = () => setShowEditModal(true);
  const handleCloseEditModal = () => setShowEditModal(false);
  const handlePostDelete = (deletedPostId) => {
    onPostDelete?.(deletedPostId);
    onClose();
  };

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'} transition-all duration-300`}>
      <div className="bg-black/50 fixed inset-0 overlay-preview" />
      <div className="relative w-full max-w-6xl h-[90vh] rounded-xl flex background_PreviewPost">
        <button
          className="close-edit rounded-full transition-colors duration-200"
          onClick={() => onClose(post.userId)}
        >
          <X className="w-7 h-7 text-white" />
        </button>
        <div className="flex flex-1 max-h-full">
          {/* Left side - Image */}
          <div className="w-[55%] h-full">
            <img
              src={post.img}
              alt="Post"
              className="w-full h-full object-cover"
              style={{ borderRadius: '10px' }}
            />
          </div>

          {/* Right side - Content */}
          <div className="w-[45%] flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => handleUserClick(userId)}
              >
                <img
                  src={profilePicture}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full"
                />
                <span className="text-white text-sm font-medium">{username}</span>
              </div>
              <button
                onClick={handleMoreOptionsClick}
                className="text-white hover:text-gray-300 transition-colors p-2"
              >
                <MoreHorizontal className="w-6 h-6" />
              </button>
            </div>

            {/* Caption and Comments Section */}
            <div
              ref={commentsContainerRef}
              className="flex-1 overflow-x-hidden p-4 scroll-comment reload"
            >
              {/* Main Caption */}
              <div className="flex items-start gap-3">
                <img
                  src={profilePicture}
                  alt={username}
                  className="w-10 h-10 rounded-full cursor-pointer"
                  onClick={() => handleUserClick(userId)}
                />
                <div className="space-y-1">
                  <span
                    className="text-white text-sm font-medium cursor-pointer hover:underline"
                    onClick={() => handleUserClick(userId)}
                  >
                    {username}
                  </span>
                  <p className="text-white text-sm whitespace-pre-line break-all">{post.caption}</p>
                  <span className="text-gray-400 text-xs">{formatTime(post.createdAt)}</span>
                </div>
              </div>

              {/* Comments Section */}
              <div className="space-y-4 pb-6">
                {loading && optimisticComments.length === 0 ? (
                  <p className="text-gray-400 text-center py-4"></p>
                ) : optimisticComments.length > 0 ? (
                  optimisticComments.map((comment) => (
                    <div key={comment._id} id={comment._id}>
                      <RenderComment
                        comment={comment}
                        onReplySubmit={handleReplyComment}
                        onClose={onClose}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-4">Chưa có bình luận nào.</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-700 ">
              <div className="p-4">
                <LikeUnlike
                  postId={post._id}
                  initialLikeStatus={post.isLiked}
                  initialLikeCount={post.likes?.length || 0}
                  onLikeUpdate={(isLiked) => onLikeUpdate(post._id, isLiked)}
                />
              </div>

              {/* Comment Input */}
              <div className="px-4 pb-4">
                <CommentInput
                  profilePicture={profileData.profilePicture}
                  onSubmit={handleSubmitComment}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditPreviewProfilePost
          onClose={handleCloseEditModal}
          postId={post._id}
          onDelete={handlePostDelete}
          isOwnProfile={isOwnProfile}
        />
      )}
    </div>
  );
};

export default PreviewProfilePost;