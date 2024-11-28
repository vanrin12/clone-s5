import React, { useEffect, useRef, useState } from 'react';
import './PreviewNote.scss';

const PreviewNote = ({ note, onEdit, onDelete, profileData, onClose }) => {
  const [noteWidth, setNoteWidth] = useState('65px'); // Default width
  const textRef = useRef(null); // Reference to the text span

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('overlay')) { // Close when clicking the overlay
      console.log('Closing preview...');
      onClose();
    }
  };

  useEffect(() => {
    // Calculate the width of the text
    if (textRef.current) {
      const textWidth = textRef.current.scrollWidth; // Get the scroll width of the text
      const calculatedWidth = Math.min(Math.max(textWidth + 30, 65), 250); // Adjust max-width as necessary
      setNoteWidth(`${calculatedWidth}px`); // Set calculated width
    }
  }, [note]); // Recalculate when the note changes

  return (
    <div className="overlay" onClick={handleOverlayClick}>
      <div className="preview-note">
        <div className="preview-note__container">
          <div className="preview-note__content">
            <div className="preview-note__user-info">
              <div className="preview-note__profile-pic">
                <img
                  src={profileData?.profilePicture}
                  alt={profileData?.fullname}
                />
              </div>
              <span className="preview-note__username">{profileData?.fullname}</span>
            </div>
            <div className="preview-note__text" style={{ width: noteWidth }}>
              <span
                className="preview-note__textNote"
                ref={textRef}
                style={{ display: 'inline-block' }} // Ensure the text is treated as a block for width calculation
              >
                {note}
              </span>
            </div>
          </div>
          <div className="preview-note__actions">
            <button className="preview-note__edit" onClick={onEdit}>
              Chỉnh sửa ghi chú
            </button>
            <button className="preview-note__delete" onClick={onDelete}>
              Xóa ghi chú
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewNote;
