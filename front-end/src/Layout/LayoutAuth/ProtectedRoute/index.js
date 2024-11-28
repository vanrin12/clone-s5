import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import config from './../../../config';

export default function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${config.API_HOST}/api/user/`, {
          method: 'POST',
          credentials: 'include', // Gửi cookie trong request
        });

        if (response.ok) {
          setIsAuthenticated(true); // Người dùng đã xác thực
        } else {
          setIsAuthenticated(false); // Người dùng không xác thực
        }
      } catch (error) {
        setIsAuthenticated(false); // Xảy ra lỗi trong quá trình kiểm tra
      }
    };

    checkAuth();
  }, []);

  // Nếu đang kiểm tra xác thực, có thể hiển thị màn hình chờ
  if (isAuthenticated === null) {
    return <div></div>;
  }
  // Nếu không xác thực, chuyển hướng về trang login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Nếu xác thực, hiển thị nội dung của route được bảo vệ
  return children;
}
