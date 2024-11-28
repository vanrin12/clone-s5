import { useEffect, useRef, useState } from "react";
import { IoSend } from "react-icons/io5";

export const CommentInput = ({
  profilePicture,
  onSubmit,
  placeholder = "Thêm bình luận...",
  initialValue = '',
  value,
  onChange
}) => {
  const [comment, setComment] = useState(initialValue);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (initialValue) {
      setComment(initialValue);
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(initialValue.length, initialValue.length);
      }
    }
  }, [initialValue]);

  // Hàm điều chỉnh chiều cao tự động
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height về min để tính toán lại chính xác scrollHeight
      textarea.style.height = '32px';

      // Tính toán chiều cao mới dựa trên nội dung
      const newHeight = Math.min(
        Math.max(textarea.scrollHeight, 32), // Không cho phép nhỏ hơn 32px
        100 // Maximum height
      );

      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [comment]);

  const handleCommentChange = (e) => {
    const newValue = e.target.value;
    setComment(newValue);
    if (onChange) {
      onChange(e);
    }
  };

  const handleSubmit = () => {
    if (comment.trim()) {
      onSubmit(comment);
      setComment("");
      if (textareaRef.current) {
        textareaRef.current.style.height = '32px';
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-center gap-3">
      <img
        src={profilePicture}
        alt="Avatar"
        className="w-8 h-8 rounded-full flex-shrink-0"
      />
      <div className="relative flex-1 min-h-[32px] max-h-[100px]">
        <textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={value || comment}
          onChange={handleCommentChange}
          onKeyPress={handleKeyPress}
          className="w-full bg-transparent text-white placeholder-gray-400 text-sm
                   resize-none border-none focus:outline-none py-1.5 px-2
                   overflow-hidden break-words whitespace-pre-wrap"
          style={{
            minHeight: '32px',
            maxHeight: '100px',
            lineHeight: '1.2',
            overflowY: 'auto',
            overflowX: 'hidden',
            wordWrap: 'break-word',
            boxSizing: 'border-box',
            display: 'block'
          }}
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={!comment.trim()}
        className="text-blue-500 hover:text-blue-400 disabled:text-gray-500
                 disabled:cursor-not-allowed transition-colors p-2 flex-shrink-0
                 h-8 w-8 flex items-center justify-center"
      >
        <IoSend className="w-5 h-5" />
      </button>
    </div>
  );
};
