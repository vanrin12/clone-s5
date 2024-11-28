import React, { useState, useEffect } from 'react';

const ProfileNote = ({ isOwnProfile, featuredNote, onEditClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [noteStyle, setNoteStyle] = useState({
    width: 'auto',
    height: 'auto',
    fontSize: '15px'
  });

  const processNote = (text) => {
    if (!text) return '';
    return text.length <= 45 ? text : text.slice(0, 45) + '...';
  };

  const measureTextWidth = (text) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = '15px Roboto'; // Use default font size
    return context.measureText(text).width;
  };

  const calculateFontSize = (length) => {
    // Reduce font size for every 10 characters, minimum 10px
    const newSize = Math.max(10, 15 - Math.floor(length / 10));
    return newSize;
  };

  useEffect(() => {
    if (featuredNote) {
      setIsExpanded(true);
      const text = processNote(featuredNote);
      const textWidth = measureTextWidth(text);
      const lineHeight = 18; // Adjust based on your font size
      const lines = Math.ceil(textWidth / 100); // Adjust 100 based on max width
      const fontSize = calculateFontSize(text.length);

      setNoteStyle({
        width: `${textWidth + 20}px`, // Add some padding
        height: `${lineHeight * lines}px`,
        fontSize: `${fontSize}px`, // Set the calculated font size
        transition: 'all 0.3s ease'
      });
    } else {
      setIsExpanded(false);
      setNoteStyle({
        width: '65px',
        height: '40px',
        fontSize: '15px', // Reset to default
        transition: 'all 0.3s ease'
      });
    }
  }, [featuredNote]);

  if (!isOwnProfile) return null;

  const displayText = isExpanded ? processNote(featuredNote) : processNote(featuredNote);

  return (
    <>
      <div
        className="profile__noteZ"
        onClick={onEditClick}
        style={{
          ...noteStyle,
          maxWidth: isExpanded ? '70%' : '100px',
          minWidth: '65px'
        }}
      >
        {featuredNote ? (
          <>
            <span style={{
              whiteSpace: isExpanded ? 'normal' : 'nowrap',
              display: isExpanded ? '-webkit-box' : 'block',
              fontSize: noteStyle.fontSize // Apply dynamic font size
            }}>
              {displayText}
            </span>
          </>
        ) : (
          <>
            <div className="note-placeholder">Ghi chú...</div>
          </>
        )}
      </div>
    </>
  );
};

export default ProfileNote;
