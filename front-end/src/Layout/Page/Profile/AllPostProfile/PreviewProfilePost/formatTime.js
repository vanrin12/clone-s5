
export const formatTime = (timestamp) => {
  const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
  const intervals = [
    { label: 'năm', seconds: 31536000 },
    { label: 'tháng', seconds: 2592000 },
    { label: 'ngày', seconds: 86400 },
    { label: 'giờ', seconds: 3600 },
    { label: 'phút', seconds: 60 },
    { label: 'giây', seconds: 1 }
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count > 0) {
      return `${count} ${interval.label} trước`;
    }
  }
  return 'vừa xong';
};
