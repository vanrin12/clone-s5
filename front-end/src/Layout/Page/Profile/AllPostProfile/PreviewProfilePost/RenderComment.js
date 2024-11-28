import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Heart } from 'lucide-react';
import { PreviewUserCard } from "./PreviewUserCard";
import { formatTime } from "./formatTime";
import { replyComment, fetchComments } from '../../../../../store/features/Comment/Comment';
import { CommentInput } from './RenderCommentInput';
export const RenderComment = ({ comment, onReplySubmit, onClose, depth = 0 }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const dispatch = useDispatch();
  const { profileData } = useSelector((state) => state.profile);
  const currentUserId = localStorage.getItem('_id');
  const previewTimeoutRef = useRef(null);
  const previewRef = useRef(null);

  const handleUserClick = (userId) => {
    if (typeof onClose === 'function') {
      onClose();
    }
    setTimeout(() => {
      window.location.href = `/profile/${userId}`;
    }, 100);
  };

  // Thêm useEffect để cleanup timeout
  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    clearTimeout(previewTimeoutRef.current);
    setShowPreview(true);
  };

  const handleMouseLeave = () => {
    previewTimeoutRef.current = setTimeout(() => {
      if (!previewRef.current?.matches(':hover')) {
        setShowPreview(false);
      }
    }, 100);
  };

  const handlePreviewMouseEnter = () => {
    clearTimeout(previewTimeoutRef.current);
  };

  const handlePreviewMouseLeave = () => {
    setShowPreview(false);
  };

  // Tính toán vị trí hiển thị preview
  const calculatePreviewPosition = () => {
    // Nếu depth > 0 (comments lồng nhau), hiển thị preview phía dưới
    return depth > 0 ? 'bottom' : 'top';
  };

  const handleStartReply = () => {
    // Tự động thêm @username khi bắt đầu trả lời
    if (currentUserId !== comment.author._id) {
      setReplyText(`@${comment.author.username} `);
    } else {
      setReplyText('');
    }
    setIsReplying(true);
  };

  const handleReplySubmit = async (text) => {
    if (!text.trim()) return;

    try {
      // Gửi reply comment
      await dispatch(replyComment({
        postId: comment.post,
        commentId: comment._id,
        text: text,
      })).unwrap();

      // Sau khi reply thành công, reload lại comment data
      await dispatch(fetchComments({ postId: comment.post })).unwrap();
      // console.log("Comment data after reply:", comment);
      // hoặc
      await dispatch(fetchComments(comment.post)).unwrap();

      // Reset các state
      setIsReplying(false);
      setShowReplies(true);
      setReplyText('');

    } catch (error) {
      // console.error("Error replying to comment:", error);
      setIsReplying(false);
      setReplyText('');
    }
  };

  const countTotalReplies = (comment) => {
    if (!comment.replies || comment.replies.length === 0) return 0;

    return comment.replies.reduce((total, reply) => {
      return total + 1 + countTotalReplies(reply);
    }, 0);
  };

  const totalReplies = depth === 0 ? countTotalReplies(comment) : 0;
  const shouldShowRepliesToggle = depth === 0 && totalReplies > 0;

  const getIndentClass = (currentDepth) => {
    const effectiveDepth = Math.min(currentDepth, 3);

    switch (effectiveDepth) {
      case 0:
        return "";
      case 1:
        return "ml-11";
      case 2:
        return "ml-[88px]";
      case 3:
        return "ml-[130px]";
      default:
        return "ml-[130px]";
    }
  };

  // phần xử lý căn lề của thanh chát input
  const getIndentClassInput = (currentDepth) => {
    const effectiveDepth = Math.min(currentDepth, 3);

    switch (effectiveDepth) {
      case 0:
        return "";
      case 1:
        return "ml-11";
      case 2:
        return "ml-[70px]";
      case 3:
        return "ml-[40px]";
      default:
        return "";
    }
  };
  const renderReplies = (replies, currentDepth) => {
    return replies.map((reply) => {
      const effectiveDepth = Math.min(currentDepth, 3);

      return (
        <div key={reply._id}>
          <div className={getIndentClass(effectiveDepth)}>
            <RenderComment
              comment={reply}
              onReplySubmit={onReplySubmit}
              onClose={onClose}
              depth={effectiveDepth}
            />
          </div>
          {reply.replies && reply.replies.length > 0 && (
            <div>
              {renderReplies(reply.replies, effectiveDepth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center gap-3 relative">
        <div
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <img
            className="w-10 h-10 rounded-full cursor-pointer"
            src={comment.author?.profilePicture}
            alt={comment.author?.username}
            onClick={() => handleUserClick(comment.author._id)}
          />
          {showPreview && (
            <div
              ref={previewRef}
              onMouseEnter={handlePreviewMouseEnter}
              onMouseLeave={handlePreviewMouseLeave}
            >
              <PreviewUserCard
                author={comment.author}
                position={calculatePreviewPosition()}
              />
            </div>
          )}
        </div>
        <span
          className="text-white text-sm font-medium cursor-pointer hover:underline"
          onClick={() => handleUserClick(comment.author._id)}
        >
          {comment.author?.username}
        </span>
      </div>

      <div className="flex justify-between ml-11">
        <div className="space-y-1 flex-1 mr-4">
          <p className="text-white text-sm whitespace-pre-line break-all">{comment.text}</p>
          <span className="text-gray-400 text-xs">{formatTime(comment.createdAt)}</span>
        </div>
        <div className="flex items-end gap-4 flex-shrink-0">
          <button
            className="text-gray-400 text-xs hover:text-white transition-colors"
            onClick={() => isReplying ? setIsReplying(false) : handleStartReply()}
          >
            {isReplying ? 'Hủy' : 'Trả lời'}
          </button>
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors cursor-pointer" />
            <span className="text-gray-400 text-xs">{comment.likes?.length || 0}</span>
          </div>
        </div>
      </div>

      {isReplying && (
        // đây là phần nút trả lời bị cách
        <div className={getIndentClassInput(depth + 1)}>
          <CommentInput
            profilePicture={profileData.profilePicture}
            onSubmit={handleReplySubmit}
            placeholder="Trả lời bình luận..."
            initialValue={replyText}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            depth={depth + 1}
          />
        </div>
      )}

      {shouldShowRepliesToggle && !showReplies && (
        <button
          onClick={() => setShowReplies(true)}
          className="ml-11 text-blue-500 hover:text-blue-400 text-sm font-medium transition-colors"
        >
          Xem {totalReplies} bình luận
        </button>
      )}

      {comment.replies && comment.replies.length > 0 && showReplies && (
        <div className="space-y-4">
          {renderReplies(comment.replies, depth + 1)}
        </div>
      )}

      {shouldShowRepliesToggle && showReplies && (
        <button
          onClick={() => setShowReplies(false)}
          className="ml-11 text-blue-500 hover:text-blue-400 text-sm font-medium transition-colors"
        >
          Ẩn bình luận
        </button>
      )}
    </div>
  );
};