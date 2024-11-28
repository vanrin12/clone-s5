import React, { useState, useEffect } from 'react';
import { HiOutlineChatBubbleOvalLeft } from "react-icons/hi2";
import { IoMdHeart } from "react-icons/io";
import { GoHeart } from "react-icons/go";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import config from './../../config';

const LikeUnlike = ({ postId, initialLikeStatus = false, initialLikeCount = 0, onLikeUpdate }) => {
  const [isLiked, setIsLiked] = useState(initialLikeStatus);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);

  // Chỉ lấy trạng thái like từ localStorage khi component mount
  useEffect(() => {
    const savedLikeStatus = localStorage.getItem(`post_${postId}_liked`);
    if (savedLikeStatus !== null) {
      setIsLiked(JSON.parse(savedLikeStatus));
    }
  }, [postId]);

  const handleLikeUnlike = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const endpoint = isLiked
        ? `${config.API_HOST}/api/post/unLikePost/${postId}`
        : `${config.API_HOST}/api/post/likePost/${postId}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const newLikeStatus = !isLiked;
        localStorage.setItem(`post_${postId}_liked`, JSON.stringify(newLikeStatus));
        setIsLiked(newLikeStatus);
        setLikeCount(prevCount => newLikeStatus ? prevCount + 1 : prevCount - 1);
        onLikeUpdate?.(newLikeStatus);
      } else {
        const errorData = await response.json();
        console.error('Error toggling like:', errorData);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý bookmark đã được đơn giản hóa
  const handleBookmark = async () => {
    if (isBookmarkLoading) return;

    try {
      setIsBookmarkLoading(true);
      const response = await fetch(`${config.API_HOST}/api/post/bookmarkPost/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setIsBookmarked(!isBookmarked); // Chỉ cập nhật state mà không lưu vào localStorage
        console.log(data.message);
      } else {
        const errorData = await response.json();
        console.error('Error toggling bookmark:', errorData);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  return (
    <div className="like-section">
      <div className="action-buttons">
        <button
          style={{ fontSize: '25px' }}
          onClick={handleLikeUnlike}
          disabled={isLoading}
          className="like-button"
        >
          {isLiked ? (
            <IoMdHeart style={{ color: '#FF3040' }} />
          ) : (
            <GoHeart />
          )}
        </button>
        <button
          style={{ fontSize: '25px', marginLeft: '10px' }}
          className="comment-button"
        >
          <HiOutlineChatBubbleOvalLeft />
        </button>
        <button
          onClick={handleBookmark}
          disabled={isBookmarkLoading}
        >
          {isBookmarked ? (
            <FaBookmark style={{
              fontSize: '20px',
              marginLeft: '10px',
              display: 'flex',
              justifyContent: 'end',
              alignItems: 'center',
              width: '100%',
              color: '#efcc00'
            }} />
          ) : (
            <FaRegBookmark style={{
              fontSize: '20px',
              marginLeft: '10px',
              display: 'flex',
              justifyContent: 'end',
              alignItems: 'center',
              width: '100%'
            }} />
          )}
        </button>
      </div>
      <div className="coutLike">{likeCount} lượt thích</div>
    </div>
  );
};

export default LikeUnlike;