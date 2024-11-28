
export const PreviewUserCard = ({ author, position }) => {
  // Tính toán vị trí dựa trên position
  const getPositionStyles = () => {
    const baseStyles = "absolute z-50 border border-gray-700 rounded-lg p-4 shadow-lg w-72";

    if (position === 'bottom') {
      return `${baseStyles} left-0 top-[calc(100%_+_8px)]`;
    }

    // Mặc định hiển thị phía trên
    return `${baseStyles} left-[50px] bottom-[calc(100%_+_-90px)]`;
  };

  return (
    <div className={getPositionStyles()}>
      <div className="flex flex-col items-center gap-3">
        <img
          src={author.profilePicture}
          alt={author.username}
          className="w-16 h-16 rounded-full"
        />
        <div className="text-center">
          <h3 className="text-white font-medium">{author.fullname}</h3>
          <p className="text-gray-400 text-sm">@{author.username}</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-300">
          <span>Reputation: {author.reputation}</span>
        </div>
      </div>
    </div>
  );
};