import { useState } from "react";
import "./EditPreviewProfilePost.scss";
import config from './../../../../../config';

export default function EditPreviewProfilePost({ onClose, postId, onDelete, isOwnProfile }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`${config.API_HOST}/api/post/deletePost/${postId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        onDelete(postId);
        onClose();
      } else {
        throw new Error(data.message || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Không thể xóa bài viết. Vui lòng thử lại sau.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="dropdown-menu">
      <div className="dropdown-menu__content">
        {isOwnProfile && ( // Chỉ hiển thị nút xoá nếu là chủ sở hữu bài viết
          <button
            className="dropdown-menu__item dropdown-menu__item--delete"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Đang xóa...' : 'Xóa'}
          </button>
        )}
        <button className="dropdown-menu__item">Chỉnh sửa</button>
        <button className="dropdown-menu__item">Ẩn số lượt thích với những người khác</button>
        <button className="dropdown-menu__item">Tắt tính năng bình luận</button>
        <button className="dropdown-menu__item">Đi đến bài viết</button>
        <button className="dropdown-menu__item">Chia sẻ lên...</button>
        <button className="dropdown-menu__item">Sao chép liên kết</button>
        <button className="dropdown-menu__item">Nhúng</button>
        <button className="dropdown-menu__item">Giới thiệu về tài khoản này</button>
        <button
          className="dropdown-menu__item dropdown-menu__item--cancel"
          onClick={onClose}
        >
          Hủy
        </button>
      </div>
    </div>
  );
}
