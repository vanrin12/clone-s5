import React, { useState, useEffect } from 'react';
import { IoClose } from "react-icons/io5";
import './NoteModal.scss';
import config from './../../../../../config';

const NoteModal = ({ isOpen, onClose, currentNote, onSave, profileData }) => {
  // Đảm bảo currentNote luôn là string
  const initialNote = typeof currentNote === 'object' ?
    currentNote.content || '' :
    currentNote || '';

  const [featuredNote, setFeaturedNote] = useState(initialNote);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const maxLength = 60;

  // Reset note khi modal mở lại
  useEffect(() => {
    if (isOpen) {
      const noteContent = typeof currentNote === 'object' ?
        currentNote.content || '' :
        currentNote || '';
      setFeaturedNote(noteContent);
      setError('');
    }
  }, [isOpen, currentNote]);

  // Xử lý overflow của body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSave = async () => {
    try {
      setError('');
      setIsSubmitting(true);

      const trimmedNote = featuredNote.trim();

      // Validation
      if (!trimmedNote) {
        setError('Vui lòng điền featured note');
        return;
      }

      if (trimmedNote.length > maxLength) {
        setError('Featured note không được quá 60 ký tự');
        return;
      }

      // Gọi API
      const response = await fetch(`${config.API_HOST}/api/user/featuredNote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ featuredNote: trimmedNote })
      });

      const data = await response.json();

      if (data.success) {
        // Luôn trả về string cho parent component
        onSave(trimmedNote);
        onClose();
      } else {
        throw new Error(data.message || 'Có lỗi xảy ra khi lưu ghi chú');
      }
    } catch (error) {
      console.error('Error saving featured note:', error);
      setError(error.message || 'Có lỗi xảy ra khi cập nhật featured note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNoteChange = (e) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      setFeaturedNote(newValue);
      setError('');
    }
  };

  if (!isOpen) return null;

  // Đảm bảo các giá trị từ profileData luôn là string
  const profilePicture = profileData?.profilePicture || '';
  const username = profileData?.username || '';

  return (
    <div className="note-modal">
      <div className="note-modal__backdrop" onClick={onClose} />
      <div className="note-modal__container">
        <div className="note-modal__header">
          <button
            className="note-modal__close"
            onClick={onClose}
            disabled={isSubmitting}
            type="button"
          >
            <IoClose />
          </button>
          <h2>Ghi chú mới</h2>
          <button
            className={`note-modal__done ${(!featuredNote.trim() || isSubmitting) ? 'disabled' : ''}`}
            onClick={handleSave}
            disabled={!featuredNote.trim() || isSubmitting}
            type="button"
          >
            {isSubmitting ? 'Đang lưu...' : 'Chia sẻ'}
          </button>
        </div>

        <div className="note-modal__content">
          <div className="note-modal__user-input">
            <div className="note-modal__profile-pic">
              {profilePicture && (
                <img
                  src={profilePicture}
                  alt={username || 'Profile picture'}
                />
              )}
            </div>
            <textarea
              value={featuredNote}
              onChange={handleNoteChange}
              placeholder="Chia sẻ suy nghĩ..."
              maxLength={maxLength}
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="note-modal__error" role="alert">
              {error}
            </div>
          )}

          <div className="note-modal__char-count">
            {featuredNote.length}/{maxLength}
          </div>

          <div className="note-modal__visibility">
            <p>Được chia sẻ với người theo dõi mà bạn theo dõi lại</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteModal;