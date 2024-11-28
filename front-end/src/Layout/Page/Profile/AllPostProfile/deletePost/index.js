import React from 'react';
import './deletePost.scss';
import { IoTrashOutline, IoClose } from "react-icons/io5";
import config from './../../../../../config';

const DeletePost = ({ isOpen, onClose, postId, onDelete }) => {
  if (!isOpen) return null;

  const handleDelete = async () => {
    try {
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
    }
  };

  return (
    <div className="delete-post-modal">
      <div className="delete-post-modal__content">
        <div className="delete-post-modal__header">
          <h2>Xóa bài viết</h2>
          <button className="delete-post-modal__close" onClick={onClose}>
            <IoClose />
          </button>
        </div>
        <div className="delete-post-modal__body">
          <p>Bạn có chắc chắn muốn xóa bài viết này không?</p>
          <p>Hành động này không thể hoàn tác.</p>
        </div>
        <div className="delete-post-modal__actions">
          <button className="delete-post-modal__delete" onClick={handleDelete}>
            <IoTrashOutline /> Xóa
          </button>
          <button className="delete-post-modal__cancel" onClick={onClose}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};
export default DeletePost;